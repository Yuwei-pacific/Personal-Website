// 02 标志：四步作图，和三块图版（几何与墨迹叠看、尺寸、和名字的组合）。
// 全是矢量，直接读 ink-tables.ts 里的两条路径；颜色跟主题走，切口用 Coral。
import type { CSSProperties, ReactNode } from "react";

import { MARK_GEO_PATH, MARK_GEO_VIEWBOX, MARK_PATH } from "@/components/ui/ink/ink-tables";
import { Mark } from "@/components/ui/mark";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { CaseIdentityCopy } from "@/i18n/case-identity";
import { cn } from "@/lib/utils";

/**
 * 一块图版：坐在比纸面深一档的底板上（和模板里偏高媒体用的底板同一个 token），下面一行等宽的图注。
 * 不描边、不加阴影 —— 手册 07：方角，不用卡片阴影。
 */
export function Plate({
  caption,
  children,
  className,
  plateClassName,
}: {
  caption?: string;
  children: ReactNode;
  className?: string;
  /** 底板自己的类：需要固定底色（纸 / 夜的样稿）时用它盖掉默认的底板色 */
  plateClassName?: string;
}) {
  return (
    <figure className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div
        className={cn(
          "flex min-h-[13rem] min-w-0 flex-1 items-center justify-center bg-design-dark-surface p-6 text-design-dark-text-primary sm:p-8",
          plateClassName,
        )}
      >
        {children}
      </div>
      {caption ? (
        <figcaption className="font-mono text-small text-design-dark-text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

// ── 四步作图 ──
// 画在 22 × 22 的方格上，一格是半个笔画；圆心在 (11, 14)，六个同心圆的半径是 3、5、6、8、9、11 格
// （手册 02「怎么切出来的」）。最外的圆会探到方格下面，所以画板比方格高。
const RADII = [3, 5, 6, 8, 9, 11];
// 一横、一竖、两条腿
const STROKES = [
  { x: 3, y: 0, width: 16, height: 2 },
  { x: 10, y: 0, width: 2, height: 22 },
  { x: 0, y: 14, width: 2, height: 8 },
  { x: 20, y: 14, width: 2, height: 8 },
];
// 三圈环的上半边
const HALF_RINGS =
  "M0 14A11 11 0 0 1 22 14H20A9 9 0 0 0 2 14ZM3 14A8 8 0 0 1 19 14H17A6 6 0 0 0 5 14ZM6 14A5 5 0 0 1 16 14H14A3 3 0 0 0 8 14Z";
// 四道切口：从圆心出发的半径
const CUTS = ["M11 14L2.733 4.758", "M11 14L19.267 4.758", "M11 14L6.867 2.309", "M11 14L15.133 2.309"];

// 线宽按屏幕像素算，图放大缩小线都是 1 px。vector-effect 不继承，写在 <g> 上没用：
// 用 HAIRLINES 这个类在 <svg> 上一次给到里面每个图形
const HAIRLINES = "[&_*]:[vector-effect:non-scaling-stroke]";
const LINE = { fill: "none", strokeWidth: 1 } as const;
const GUIDE = { ...LINE, strokeDasharray: "3 3", className: "stroke-design-dark-text-muted" } as const;

function Circles({ guide }: { guide: boolean }) {
  return (
    <g {...(guide ? GUIDE : { ...LINE, stroke: "currentColor" })}>
      {RADII.map((r) => (
        <circle key={r} cx={11} cy={14} r={r} />
      ))}
    </g>
  );
}

// 一步只有图，不配说明：四张从左到右就是顺序，章节开头那句话已经说了「六个圆、几条直线、四刀」
function Step({ children }: { children: ReactNode }) {
  return (
    <li className="min-w-0">
      <svg viewBox="-0.5 -0.5 23 26" aria-hidden="true" className={cn("h-auto w-full", HAIRLINES)}>
        {children}
      </svg>
    </li>
  );
}

function Construction() {
  return (
    <ol className="grid w-full grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
      <Step>
        <rect width={22} height={22} {...GUIDE} />
        <Circles guide={false} />
        <path d="M10.5 14H11.5M11 13.5V14.5" {...LINE} className="stroke-accent" />
      </Step>
      <Step>
        <Circles guide />
        <g {...LINE} stroke="currentColor">
          {STROKES.map((s) => (
            <rect key={`${s.x}-${s.y}`} {...s} />
          ))}
        </g>
      </Step>
      <Step>
        <Circles guide />
        <g fill="currentColor">
          <path d={HALF_RINGS} />
          {/* 两条腿往上多搭 0.1 格，盖住它和拱相接处的抗锯齿细缝 */}
          {STROKES.map((s) => (
            <rect key={`${s.x}-${s.y}`} {...s} y={s.y ? s.y - 0.1 : 0} height={s.y ? s.height + 0.1 : s.height} />
          ))}
        </g>
        <g {...LINE} className="stroke-accent">
          {CUTS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </Step>
      <Step>
        {/* 几何版的路径画在 99 个单位见方的画板上（原点 10,10）：缩到 22 格 */}
        <g transform="scale(0.222222) translate(-10 -10)" fill="currentColor">
          <path d={MARK_GEO_PATH} />
        </g>
      </Step>
    </ol>
  );
}

// 几何版（20 px 以下用的那一版）
function GeoMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox={MARK_GEO_VIEWBOX} aria-hidden="true" className={className} style={style} fill="currentColor">
      <path d={MARK_GEO_PATH} />
    </svg>
  );
}

// 标志和名字的组合（手册 02）：名字用 Fraunces Regular，大写字母的高度是标志高度的 0.42
// （Fraunces 的大写高约 0.7 em，所以字号 = 标志高度 × 0.6）。间距按笔画算，一笔是标志高度的 1/11
function Lockup({ name, stacked = false }: { name: string; stacked?: boolean }) {
  return (
    <div
      className={cn("flex [--h:3.25rem]", stacked ? "flex-col items-center" : "items-baseline")}
      style={{ gap: `calc(var(--h) * ${stacked ? 3 : 2} / 11)` }}
    >
      <Mark className="h-[var(--h)] w-auto shrink-0" />
      <span className="whitespace-nowrap font-display leading-none" style={{ fontSize: "calc(var(--h) * 0.6)" }}>
        {name}
      </span>
    </div>
  );
}

export function MarkPlates({ copy, name }: { copy: CaseIdentityCopy["mark"]; name: string }) {
  return (
    <>
      <ScrollReveal>
        <Plate caption={copy.construction}>
          <Construction />
        </Plate>
      </ScrollReveal>

      {/* 两块并排（lg 起；再窄每块装不下一排四个尺寸，改成一列），组合单独占一行。
          试过三块一排：中等宽度的屏幕上每块只有两百多 px，尺寸那一排和名字都顶出了底板（用户 2026-11-26） */}
      <ScrollReveal className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
        <Plate caption={copy.both}>
          {/* 线是几何，淡墨是墨迹：同一副骨架。两条路径的坐标系不同，几何版按手册里的换算放进墨迹版的画板 */}
          <svg viewBox="8 9.5 36 36.6" aria-hidden="true" className={cn("h-40 w-auto", HAIRLINES)}>
            <path d={MARK_PATH} fillRule="evenodd" fill="currentColor" opacity={0.3} />
            <g transform="translate(5.2327 6.9867) scale(0.34903)" {...LINE} className="stroke-accent">
              <path d={MARK_GEO_PATH} />
            </g>
          </svg>
        </Plate>

        <Plate caption={copy.sizes}>
          <div className="flex items-end gap-5">
            <Mark className="h-24 w-auto" />
            <Mark className="h-12 w-auto" />
            <Mark className="h-7 w-auto" />
            {/* 20 px 以下换几何版 */}
            <GeoMark className="size-4" />
          </div>
        </Plate>
      </ScrollReveal>

      <ScrollReveal>
        <Plate caption={copy.lockup}>
          <div className="flex flex-wrap items-end justify-center gap-x-16 gap-y-10 sm:gap-x-24">
            <Lockup name={name} />
            <Lockup name={name} stacked />
          </div>
        </Plate>
      </ScrollReveal>
    </>
  );
}
