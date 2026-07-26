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

// GROQ 投影出来的媒体原始形状，gallery 与正文模块共用
type RawProjectMedia = {
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
const normalizeProjectMedia = (
  media: RawProjectMedia | null | undefined,
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

// 画廊条目：图片是每条的视觉锚点（缩略图 + 布局宽高比 + 视频封面帧），
// 视频是可选的附加播放源。挂了视频不会让条目消失。
const normalizeGallery = (
  gallery: NonNullable<PROJECT_QUERY_RESULT>["gallery"]
): ProjectGalleryItem[] =>
  (gallery ?? []).flatMap((item, index): ProjectGalleryItem[] => {
    const normalized = normalizeProjectMedia(
      item,
      `gallery-${index}-${text(item.image?.url)}`
    );
    if (!normalized) return [];

    const { video: videoSource, ...base } = normalized;
    if (videoSource) {
      return [
        {
          ...base,
          kind: "video",
          videoUrl: videoSource.url,
          mimeType: videoSource.mimeType,
        },
      ];
    }

    return [{ ...base, kind: "image" }];
  });

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
        const media = normalizeProjectMedia(section.media, `${key}-media`);
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
        const media = normalizeProjectMedia(section.media, `${key}-media`);
        if (!media) return [];
        return [{ kind: "media", key, media, fullWidth: section.fullWidth === true }];
      }

      case "mediaGroupSection": {
        const items = (section.items ?? []).flatMap((item, index) => {
          const media = normalizeProjectMedia(item, `${key}-${index}`);
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
