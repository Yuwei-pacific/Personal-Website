// 媒体 URL 生成的唯一出处。
//
// 动图（GIF）的关键约束：Sanity 资源 CDN 支持返回动画，但 `auto=format` 会把
// GIF 转成 WebP 并只输出第一帧，动画就没了。所以凡是动图，一律不加 auto=format
// （其余尺寸/裁切参数不影响动画）。判断依据是资源的 mimeType。
import type { ImageLoaderProps } from "next/image";
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

/**
 * next/image 的 Sanity loader：让浏览器按 srcset 档位直连 Sanity CDN 取图，
 * 不再经过 /_next/image。
 *
 * 为什么不交给 Next 优化器：优化器回源时不声明 webp，`auto=format` 于是回落成
 * 原始 PNG（一张 1600 宽的封面约 1MB），再由优化器重编码一遍 —— 双重处理、
 * 慢（本地实测出现过回源超时、封面整排空白），还消耗 Vercel 图片优化额度。
 * Sanity CDN 本身就能缩放和协商格式，浏览器直连时会拿到 webp/avif。
 *
 * 约定：src 是 buildCropUrl / buildScaledUrl 生成的地址。
 * - 其中的 w 视为上限：档位宽于它时不放大（裁切图会被 Sanity 放大，原样照搬会浪费）
 * - 带 h（定比例裁切）时按同一比例换算新的 h，保住裁切框
 * - auto=format 是否存在由调用方按 mimeType 决定（动图不加），这里不碰
 */
export function sanityImageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!isSanityCdn(src)) return src;

  const url = new URL(src);
  const params = url.searchParams;
  const maxWidth = Number(params.get("w")) || Infinity;
  const baseHeight = Number(params.get("h"));
  const targetWidth = Math.min(width, maxWidth);

  if (baseHeight && Number.isFinite(maxWidth)) {
    params.set("h", String(Math.round((targetWidth * baseHeight) / maxWidth)));
  }
  params.set("w", String(targetWidth));
  if (!params.has("fit")) params.set("fit", "max");
  if (quality) params.set("q", String(quality));

  return url.toString();
}
