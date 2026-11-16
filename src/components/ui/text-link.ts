// 文字链：墨色的字，下面一道强调色的线（品牌手册 03：强调色只落在线和点上）。
// 全站的主要链接都是这一种写法 —— 首屏和首页 About 的 CTA、项目页的外链、404 和错误页的出口。
// 只有字号分档；触屏上保持 44px 的点按高度，sm 起收回行高。
import { cn } from "@/lib/utils";

const base =
  "inline-flex min-h-11 w-fit touch-manipulation items-center border-b-2 border-accent leading-[1.3] tracking-[-0.02em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:min-h-0";

const sizes = {
  /** 首屏、首页 About、404 */
  lg: "text-xl sm:text-2xl",
  /** 项目页的外链 */
  md: "text-lg sm:text-xl",
  /** 错误页这类小字场合 */
  sm: "text-small",
} as const;

export function textLink(size: keyof typeof sizes = "lg", className?: string) {
  return cn(base, sizes[size], className);
}
