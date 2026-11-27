// 02 标志：作图动画（mark-motion.tsx），和三块图版（几何与墨迹叠看、尺寸、和名字的组合）。
// 图版全是矢量，直接读 ink-tables.ts 里的两条路径；颜色跟主题走。
// 作图原先是四张并排的静态图，2026-11-27 换成一段跟着滚动走的动画，一路画到化开（用户定的）。
import type { CSSProperties, ReactNode } from "react";

import { MARK_GEO_PATH, MARK_GEO_VIEWBOX, MARK_PATH } from "@/components/ui/ink/ink-tables";
import { Mark } from "@/components/ui/mark";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { CaseIdentityCopy } from "@/i18n/case-identity";
import { cn } from "@/lib/utils";

import { MarkMotion } from "./mark-motion";

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

// 线宽按屏幕像素算，图放大缩小线都是 1 px。vector-effect 不继承，写在 <g> 上没用：
// 用 HAIRLINES 这个类在 <svg> 上一次给到里面每个图形
const HAIRLINES = "[&_*]:[vector-effect:non-scaling-stroke]";
const LINE = { fill: "none", strokeWidth: 1 } as const;

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
      {/* 不包 ScrollReveal：它自己跟着滚动走，而且要钉在屏幕上，外面不能再有位移动画 */}
      <MarkMotion caption={copy.construction} hint={copy.hint} label={copy.markLabel} />

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
