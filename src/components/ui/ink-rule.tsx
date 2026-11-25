// 墨线分隔线：一笔手画的素墨线，代替笔直的 border（品牌手册 08）。不带晕，不化开。
// 纯 SVG，没有画布、没有交互；颜色跟文字色走（currentColor），深浅模式自动切换。
//
// 线是画出来的，不是算出来的：下面是几条固定的路径，轮换着用。每条都是一个闭合的形（不是描边）——
// 头尾收成笔尖，中间约 1.5 px，粗细和高低都略有起伏。同一屏里几条线并排时传不同的 variant，
// 不重复同一条。不用 CSS 的波浪下划线，也不用随机抖动去生成。
//
// 占位高度是 1px，和它替换掉的 border 一样，所以换上去不改变排版；线本身画在上下各几 px 的范围里。
// 起伏很缓（整条线只有两三个弯），横向压到手机那么窄也不会挤成波浪，所以直接拉伸铺满，两端的笔尖都看得见。
import { cn } from "@/lib/utils";

// viewBox 1000 × 8，中线约 y = 4；1 个单位高 = 1 px（主线）
const PATHS = [
  "M0 4.1C40 3.4 90 3.2 160 3.5C280 4 380 2.9 520 3.3C660 3.7 790 4.6 900 4.2C950 4 985 3.9 1000 4C985 4.5 950 4.9 900 5.3C790 6 660 5.1 520 4.9C380 4.7 280 5.6 160 5C90 4.7 40 4.5 0 4.1Z",
  "M0 3.8C50 3.9 130 4.6 240 4.4C370 4.1 470 3 610 3.4C730 3.7 840 4.5 930 4.1C965 3.9 990 3.7 1000 3.6C990 4.2 965 4.9 930 5.2C840 5.9 730 5.3 610 5C470 4.6 370 5.7 240 5.9C130 6 50 4.9 0 3.8Z",
  "M0 4.6C60 3.9 150 3.1 270 3.4C400 3.7 500 4.5 640 4.2C760 3.9 850 3 940 3.4C970 3.6 990 4 1000 4.3C990 4.6 970 4.8 940 4.7C850 4.5 760 5.4 640 5.7C500 6 400 5.2 270 5C150 4.7 60 5 0 4.6Z",
  "M0 4C70 3.2 170 3.6 300 3.9C420 4.2 540 3.1 680 2.9C790 2.8 880 3.7 950 3.9C975 4 992 4.2 1000 4.4C992 4.8 975 5 950 5.1C880 5.3 790 4.5 680 4.5C540 4.6 420 5.6 300 5.5C170 5.3 70 4.6 0 4Z",
];

export function InkRule({
  variant = 0,
  tone = "strong",
  className,
}: {
  /** 第几条线；超出范围会循环 */
  variant?: number;
  /** strong：墨色、约 1.5px，区块顶上的主线；soft：淡墨线色、约 1px，行与行之间 */
  tone?: "strong" | "soft";
  className?: string;
}) {
  const strong = tone === "strong";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative h-px",
        strong ? "text-design-light-text-primary" : "text-design-light-border",
        className,
      )}
    >
      {/* 淡墨线用同一组路径，画在矮一些的盒子里：起伏和粗细一起收小 */}
      <svg
        viewBox="0 0 1000 8"
        preserveAspectRatio="none"
        className={cn("absolute inset-x-0 block w-full fill-current", strong ? "-top-[4px] h-[8px]" : "-top-[2.5px] h-[5.5px]")}
      >
        <path d={PATHS[((variant % PATHS.length) + PATHS.length) % PATHS.length]} />
      </svg>
    </div>
  );
}
