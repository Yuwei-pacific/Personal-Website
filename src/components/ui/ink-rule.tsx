// 墨线分隔线：首屏那根线去掉晕之后的样子（和页脚那根一样）—— 一笔略有起伏的素线，代替笔直的 border。
// 纯 SVG，没有画布、没有交互；颜色跟文字色走（currentColor），深浅模式自动切换。
//
// 占位高度是 1px，和它替换掉的 border 一样，所以换上去不改变排版；线本身画在上下各 7px 的范围里。
// 几条线并排时传不同的 variant：每条的起伏不一样，才像一笔一笔画的，而不是同一个图案复制几遍。
import { cn } from "@/lib/utils";

// 起伏的走势（viewBox 1000 × 14，中线 y = 7）
const PATHS = [
  "M0 7C80 3.5 160 3.5 250 7S420 10.5 500 7S670 3.5 750 7S920 9.5 1000 7",
  "M0 7C90 9.5 190 10 280 7S430 4 540 7S700 10 800 7S940 5 1000 7",
  "M0 7C60 5 150 4.5 220 7S380 9.5 470 7S640 4 720 7S900 9 1000 7",
  "M0 7C110 9 200 9.5 310 7S480 4.5 580 7S760 9.5 850 7S960 5.5 1000 7",
];

export function InkRule({
  variant = 0,
  tone = "strong",
  className,
}: {
  /** 第几种起伏；超出范围会循环 */
  variant?: number;
  /** strong：墨色、2px，区块顶上的主线；soft：淡墨线色、1px、起伏减半，行与行之间 */
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
      {/* 窄屏上线不压缩到屏幕那么窄（起伏会挤成波浪）：保持最小宽度，右边多出来的裁掉 */}
      <div className={cn("absolute inset-x-0 overflow-hidden", strong ? "-top-[7px] h-[14px]" : "-top-[3.5px] h-[7px]")}>
        <svg viewBox="0 0 1000 14" preserveAspectRatio="none" className="absolute left-0 top-0 h-full w-full min-w-[56rem]">
          <path
            d={PATHS[((variant % PATHS.length) + PATHS.length) % PATHS.length]}
            fill="none"
            stroke="currentColor"
            strokeWidth={strong ? 2 : 1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
