"use client";

// 首页 About 里唯一的一处墨：把标题里的一个词手画圈起来（走法见 work/ink-geometry.ts 的 aboutCircle）。
// 这一屏是首屏与 Work 之间安静下来的地方：圈不化开（quiet），只是素墨。
// 所有宽度都画：词在哪一行、多大，都是现量的。
import { InkSurface, type InkSpec } from "@/components/ui/ink/ink-surface";
import { INK_TABLES } from "@/components/ui/ink/ink-tables";

import { WORK_INK, aboutCircle, strokeBand, strokeCore } from "./work/ink-geometry";


const titleOf = (box: HTMLElement) => box.parentElement?.querySelector('[data-ink="about-title"]') ?? null;

// 标题里每个词的遮罩层（span[aria-hidden]）。量遮罩而不是词本身：入场动画里词在遮罩下方，位置会变
const wordMasks = (title: Element | null) => (title ? [...title.querySelectorAll('span[aria-hidden="true"]')] : []);

// 词尾的标点不圈进去（意大利语是「disegno,」）：遮罩量到的是整个词连标点，
// 这里按字宽的比例把标点那一截从右边去掉。用 canvas 量比例，不受入场动画里位移和旋转的影响
function inkedWidth(mask: Element, width: number) {
  const text = mask.textContent ?? "";
  const bare = text.replace(/[,.;:!?]+$/, "");
  if (!bare || bare === text) return width;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return width;
  ctx.font = getComputedStyle(mask).font;
  const full = ctx.measureText(text).width;
  return full > 0 ? (width * ctx.measureText(bare).width) / full : width;
}

function buildAbout(_width: number, _height: number, box: HTMLElement): InkSpec {
  const boxRect = box.getBoundingClientRect();
  const title = titleOf(box);
  const masks = wordMasks(title);
  // 要圈的词：标题容器上的 data-ink-word 是词的序号
  const mask = masks[Number(title?.getAttribute("data-ink-word") ?? NaN)];
  const r = mask?.getBoundingClientRect();
  const word =
    r && mask
      ? { x: r.left - boxRect.left, y: r.top - boxRect.top, width: inkedWidth(mask, r.width), height: r.height }
      : null;
  const titleBottom = Math.max(0, ...masks.map((m) => m.getBoundingClientRect().bottom));
  const stroke = aboutCircle(word, r ? r.bottom > titleBottom - 4 : true);
  // 笔画跟着字号走：手机上标题小，同样粗的圈会比字还重，也挤不进词与词之间的空
  const scale = r ? Math.min(1, Math.max(0.5, r.height / 100)) : 1;
  return {
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    draw: (ctx) => strokeBand(ctx, stroke, scale),
    drawCore: (ctx) => strokeCore(ctx, stroke, scale),
    params: { ...WORK_INK, reveal: null, quiet: true, maxDpr: 1.5 },
  };
}

const watchSlots = (box: HTMLElement) => [titleOf(box)];

export function AboutInk() {
  return (
    <InkSurface
      className="absolute inset-0"
      tables={INK_TABLES}
      build={buildAbout}
      buildKey="about"
      watch={watchSlots}
      fallback={null}
    />
  );
}
