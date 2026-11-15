"use client";

// 首页 About 里唯一的一处墨：把标题里的一个词手画圈起来（走法见 work/ink-geometry.ts 的 aboutCircle）。
// 这一屏是首屏与 Work 之间安静下来的地方：圈不化开（quiet），只是素墨。
// 只在 lg 起出现：窄屏标题字小、折行不定，圈容易压到相邻的字。
import { useSyncExternalStore } from "react";

import { InkSurface, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";

import { WORK_INK, aboutCircle, strokeBand, strokeCore } from "./work/ink-geometry";

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };

const wideQuery = "(min-width: 1024px)";
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(wideQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isWide = () => window.matchMedia(wideQuery).matches;

const titleOf = (box: HTMLElement) => box.parentElement?.querySelector('[data-ink="about-title"]') ?? null;

// 标题里每个词的遮罩层（span[aria-hidden]）。量遮罩而不是词本身：入场动画里词在遮罩下方，位置会变
const wordMasks = (title: Element | null) => (title ? [...title.querySelectorAll('span[aria-hidden="true"]')] : []);

function buildAbout(_width: number, _height: number, box: HTMLElement): InkSpec {
  const boxRect = box.getBoundingClientRect();
  const title = titleOf(box);
  const masks = wordMasks(title);
  // 要圈的词：标题容器上的 data-ink-word 是词的序号
  const mask = masks[Number(title?.getAttribute("data-ink-word") ?? NaN)];
  const r = mask?.getBoundingClientRect();
  const word = r ? { x: r.left - boxRect.left, y: r.top - boxRect.top, width: r.width, height: r.height } : null;
  const titleBottom = Math.max(0, ...masks.map((m) => m.getBoundingClientRect().bottom));
  const stroke = aboutCircle(word, r ? r.bottom > titleBottom - 4 : true);
  return {
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    draw: (ctx) => strokeBand(ctx, stroke),
    drawCore: (ctx) => strokeCore(ctx, stroke),
    params: { ...WORK_INK, reveal: null, quiet: true, maxDpr: 1.5 },
  };
}

const watchSlots = (box: HTMLElement) => [titleOf(box)];

export function AboutInk() {
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);
  if (!wide) return null;
  return (
    <InkSurface
      className="absolute inset-0"
      tables={TABLES}
      build={buildAbout}
      buildKey="about"
      watch={watchSlots}
      fallback={null}
    />
  );
}
