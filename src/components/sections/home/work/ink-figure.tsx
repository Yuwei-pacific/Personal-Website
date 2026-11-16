// 作品区里的小人：用户自己的线稿（原稿在 Figma「Home — 设计稿」页），坐在墨滩上沿、趴在目录那根线上。
// 它们是作品的陪衬，不是内容：aria-hidden、不接收指针。手机上也出现（位置由用它的地方按断点给）。
// 线稿本身是透明底上的墨色线条；深色模式在 globals.css 里反相成白线（和深色模式的白色墨芯一致 ——
// 线稿可以反相，照片不行）。
import Image from "next/image";

import { cn } from "@/lib/utils";

// 两张线稿：从用户的姿势表按 Figma 里的裁切取出，2 倍于设计稿里的显示尺寸
export const FIGURES = {
  laptop: { src: "/illustrations/figure-laptop.png", width: 412, height: 438 },
  lean: { src: "/illustrations/figure-lean.png", width: 352, height: 424 },
} as const;

export function InkFigure({
  figure,
  className,
  style,
}: {
  figure: keyof typeof FIGURES;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { src, width, height } = FIGURES[figure];
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt=""
      aria-hidden="true"
      sizes="220px"
      className={cn("ink-figure pointer-events-none absolute h-auto select-none", className)}
      style={style}
    />
  );
}
