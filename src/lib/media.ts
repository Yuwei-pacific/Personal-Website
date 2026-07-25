// 媒体 URL 生成的唯一出处。
//
// 动图（GIF）的关键约束：Sanity 资源 CDN 支持返回动画，但 `auto=format` 会把
// GIF 转成 WebP 并只输出第一帧，动画就没了。所以凡是动图，一律不加 auto=format
// （其余尺寸/裁切参数不影响动画）。判断依据是资源的 mimeType。
import { urlFor } from "@/sanity/image";
import type { SanityImageSource } from "@sanity/image-url";

/** 该资源是否需要按动图处理（跳过格式自动协商） */
export const isAnimatedImage = (mimeType?: string | null) => mimeType === "image/gif";

const isSanityCdn = (url: string) => url.includes("cdn.sanity.io");

/**
 * 按 hotspot/crop 生成定尺裁切图（用于项目卡片封面）。
 * 动图跳过 auto=format 以保住动画。
 */
export function buildCropUrl(
  source: SanityImageSource,
  { width, height, animated }: { width: number; height: number; animated: boolean }
) {
  const builder = urlFor(source).width(width).height(height).fit("crop");
  return (animated ? builder : builder.auto("format")).url();
}

/**
 * 给已有的 Sanity 资源 URL 追加缩放参数（用于画廊缩略图与 lightbox 大图）。
 * 非 Sanity CDN 的地址原样返回。
 */
export function buildScaledUrl(
  url: string,
  { width, animated }: { width: number; animated: boolean }
) {
  if (!isSanityCdn(url)) return url;

  const params = new URLSearchParams({ w: String(width), fit: "max" });
  if (!animated) params.set("auto", "format");
  return `${url}?${params.toString()}`;
}

/**
 * 生成多档宽度的 srcSet 条目，自动过滤掉比原图还宽的档位（避免请求放大图）。
 */
export function buildSrcSet(
  { url, width, height, animated }: { url: string; width: number; height: number; animated: boolean },
  candidateWidths: readonly number[]
) {
  if (!isSanityCdn(url)) return undefined;

  return candidateWidths
    .filter((w) => w < width)
    .map((w) => ({
      src: buildScaledUrl(url, { width: w, animated }),
      width: w,
      height: Math.round((height / width) * w),
    }));
}
