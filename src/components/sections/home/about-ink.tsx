"use client";

// 首页 About 里的那一段墨线：从页面左缘进来（呼应首屏那根从左缘穿进标志的线），在标题下面走成手写下划线，
// 绕过人像的头顶和右肩，再流进 Work（走法见 work/ink-geometry.ts 的 aboutThread，用户在 Figma 定稿）。
// 这一屏是首屏与 Work 之间安静下来的地方：墨线不化开（quiet），只留一根素墨。
// 只在 lg 起出现：窄屏的人像与版式不同，墨线会穿过文字。
import { useSyncExternalStore } from "react";

import { InkSurface, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";

import { THREAD_SEAM, WORK_INK, aboutThread, strokeBand, strokeCore, type Rect } from "./work/ink-geometry";

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };

const wideQuery = "(min-width: 1024px)";
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(wideQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isWide = () => window.matchMedia(wideQuery).matches;

function relative(element: Element, box: DOMRect): Rect {
  const r = element.getBoundingClientRect();
  return { x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height };
}

// 标题文字实际占的范围：取每个词的遮罩层（span[aria-hidden]）合起来。
// 不能量标题本身（块级元素，宽度是整栏），也不能量词本身（入场动画里它们在遮罩下方，位置会变）
function titleRect(title: Element | null, box: DOMRect): Rect | null {
  const masks = title ? [...title.querySelectorAll('span[aria-hidden="true"]')] : [];
  if (!masks.length) return null;
  const rects = masks.map((m) => m.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { x: left - box.left, y: top - box.top, width: right - left, height: bottom - top };
}

function buildAbout(width: number, height: number, box: HTMLElement): InkSpec {
  const boxRect = box.getBoundingClientRect();
  const section = box.parentElement;
  const slot = section?.querySelector('[data-ink="portrait"]');
  // 占位里是人像（正方形）加图注：线只绕人像那一方块
  const portrait = slot ? relative(slot, boxRect) : null;
  const square = portrait ? { ...portrait, height: portrait.width } : null;
  const thread = aboutThread(width, height, titleRect(section?.querySelector('[data-ink="about-title"]') ?? null, boxRect), square);
  return {
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    draw: (ctx) => strokeBand(ctx, thread),
    drawCore: (ctx) => strokeCore(ctx, thread),
    params: { ...WORK_INK, ...THREAD_SEAM, reveal: null, quiet: true },
  };
}

const watchSlots = (box: HTMLElement) => [
  box.parentElement?.querySelector('[data-ink="portrait"]') ?? null,
  box.parentElement?.querySelector('[data-ink="about-title"]') ?? null,
];

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
