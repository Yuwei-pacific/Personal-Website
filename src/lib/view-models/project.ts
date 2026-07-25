import { getSafeHref } from "@/lib/safe-url";
import type { PROJECT_QUERY_RESULT } from "@/sanity/sanity.types";
import { isAnimatedImage } from "@/lib/media";
import { blocks, optionalText, stringList, text, video } from "./utils";
import type { ProjectDetail, ProjectGalleryItem, ProjectLink } from "./types";

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
    body: blocks(item.body),
    myContribution: blocks(item.myContribution),
  };
}
