import { getSafeHref } from "@/lib/safe-url";
import type { PROJECT_QUERY_RESULT } from "@/sanity/sanity.types";
import { isAnimatedImage } from "@/lib/media";
import { blocks, optionalText, stringList, text, video } from "./utils";
import type {
  ProjectDetail,
  ProjectGalleryItem,
  ProjectLink,
  ProjectSection,
  ProjectSectionMedia,
} from "./types";

const normalizeLinks = (links: NonNullable<NonNullable<PROJECT_QUERY_RESULT>["links"]>): ProjectLink[] =>
  links.map((link, index) => {
    const originalUrl = optionalText(link.url);
    const href = getSafeHref(originalUrl);
    return {
      key: link._key || `link-${index}`,
      label: text(link.label, href || originalUrl || "Link"),
      href,
      originalUrl,
    };
  });

// 画廊条目：图片是每条的视觉锚点（缩略图 + 布局宽高比 + 视频封面帧），
// 视频是可选的附加播放源。唯一的丢弃条件是「图片本身缺失或没有尺寸」——
// 挂了视频绝不会让一条目消失。
const normalizeGallery = (
  gallery: NonNullable<PROJECT_QUERY_RESULT>["gallery"]
): ProjectGalleryItem[] =>
  (gallery ?? []).flatMap((item, index): ProjectGalleryItem[] => {
    // alt 可留空：空串表示装饰性媒体，渲染时让屏幕阅读器跳过图片本身，
    // 可点击按钮另给位置性名称（见 project-gallery.tsx）。
    // 不在这里编造 "Project media 1" 之类的文案——那对读屏用户只是噪音
    const alt = text(item.alt);
    const caption = optionalText(item.caption);

    const imageUrl = text(item.image?.url);
    const { width, height } = item.image ?? {};
    if (!imageUrl || !width || !height) return [];

    const base = {
      key: `gallery-${index}-${imageUrl}`,
      alt,
      caption,
      imageUrl,
      imageAnimated: isAnimatedImage(item.image?.mimeType),
      width,
      height,
    };

    const videoSource = video(item.video);
    if (videoSource) {
      return [
        {
          ...base,
          kind: "video" as const,
          videoUrl: videoSource.url,
          mimeType: videoSource.mimeType,
        },
      ];
    }

    return [{ ...base, kind: "image" as const }];
  });

// GROQ 投影出来的媒体位原始形状（三种模块共用）
type RawSectionMedia = {
  alt: string | null;
  caption: string | null;
  image: {
    url: string | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
  } | null;
  video: { url: string | null; mimeType: string | null } | null;
};

// 图片缺失或没有尺寸的媒体位直接丢弃：布局依赖宽高比，
// 而视频文件本身没有尺寸元数据，只能由图片提供
const normalizeSectionMedia = (
  media: RawSectionMedia | null | undefined,
  key: string
): ProjectSectionMedia | null => {
  const imageUrl = text(media?.image?.url);
  const width = media?.image?.width;
  const height = media?.image?.height;
  if (!imageUrl || !width || !height) return null;

  return {
    key,
    imageUrl,
    imageAnimated: isAnimatedImage(media?.image?.mimeType),
    width,
    height,
    alt: text(media?.alt),
    caption: optionalText(media?.caption),
    video: video(media?.video),
  };
};

// 内容模块：按 _type 分派。任何缺少必要内容的模块都跳过而不是渲染成空壳。
const normalizeSections = (
  sections: NonNullable<PROJECT_QUERY_RESULT>["sections"]
): ProjectSection[] =>
  (sections ?? []).flatMap((section): ProjectSection[] => {
    const key = section._key;

    switch (section._type) {
      case "richTextSection": {
        const content = blocks(section.content);
        if (!content.length) return [];
        return [{ kind: "richText", key, heading: optionalText(section.heading), content }];
      }

      case "quoteSection": {
        const quote = text(section.quote);
        if (!quote) return [];
        return [
          { kind: "quote", key, quote, attribution: optionalText(section.attribution) },
        ];
      }

      case "mediaTextSection": {
        const content = blocks(section.content);
        const media = normalizeSectionMedia(section.media, `${key}-media`);
        if (!content.length || !media) return [];
        return [
          {
            kind: "mediaText",
            key,
            heading: optionalText(section.heading),
            content,
            media,
            mediaPosition: section.mediaPosition === "right" ? "right" : "left",
          },
        ];
      }

      case "mediaSection": {
        const media = normalizeSectionMedia(section.media, `${key}-media`);
        if (!media) return [];
        return [{ kind: "media", key, media, fullWidth: section.fullWidth === true }];
      }

      case "mediaGroupSection": {
        const items = (section.items ?? []).flatMap((item, index) => {
          const media = normalizeSectionMedia(item, `${key}-${index}`);
          return media ? [media] : [];
        });
        if (!items.length) return [];
        return [{ kind: "mediaGroup", key, items, caption: optionalText(section.caption) }];
      }

      default:
        return [];
    }
  });

export function normalizeProjectDetail(
  item: PROJECT_QUERY_RESULT,
  fallbackSlug: string
): ProjectDetail | null {
  if (!item) return null;

  const title = text(item.title, "Untitled project");
  const slug = text(item.slug, fallbackSlug);
  if (!slug) return null;

  const coverUrl = text(item.coverImage?.url);

  return {
    _id: item._id,
    title,
    summary: text(item.summary),
    role: stringList(item.role),
    tags: stringList(item.tags),
    contributors: stringList(item.contributors),
    slug,
    year: item.year ?? null,
    projectType: optionalText(item.projectType),
    client: optionalText(item.client),
    location: optionalText(item.location),
    links: normalizeLinks(item.links ?? []),
    coverImage: coverUrl
      ? {
          url: coverUrl,
          alt: text(item.coverImage?.alt, `${title} cover image`),
          animated: isAnimatedImage(item.coverImage?.mimeType),
        }
      : null,
    coverVideo: video(item.coverVideo),
    gallery: normalizeGallery(item.gallery),
    sections: normalizeSections(item.sections),
    myContribution: blocks(item.myContribution),
  };
}
