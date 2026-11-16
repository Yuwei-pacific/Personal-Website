"use client";

// 化开的元素：L·i 标志、首屏口号里的单词、从标志流出来的墨线（品牌手册第 02–04、08 章）。
//
// 这里是 WebGL 版（ui/ink/）：持续流动、呼吸，鼠标划过像筷子划开汤里的油，而且不掉帧。
// 浏览器不支持 WebGL2 时换成静态的 SVG 滤镜版，它在 ui/ink/ink-fallback.tsx 里、按需加载。
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { INK_TABLES, MARK_INK_BOX, MARK_PATHS, WORD_BASELINE, WORD_BASELINE_PAD, WORD_FONT_SIZE, estimateBox } from "./ink/ink-tables";
import { InkSurface, useInkSupported, type InkSpec } from "./ink/ink-surface";

// SVG 兜底：只在不支持 WebGL2 时才渲染，所以不进主包
const InkMarkSvg = dynamic(() => import("./ink/ink-fallback").then((m) => m.InkMarkSvg), { ssr: false });
const InkWordSvg = dynamic(() => import("./ink/ink-fallback").then((m) => m.InkWordSvg), { ssr: false });
const InkLineSvg = dynamic(() => import("./ink/ink-fallback").then((m) => m.InkLineSvg), { ssr: false });

// ── WebGL 版本（对外） ─────────────────────────────────────────────────

// 标志和单词用同一张表：芯的颜色跟着主题走（纸上是墨色，夜里是纸色）
const MARK_TABLES = INK_TABLES;
const WORD_TABLES = INK_TABLES;

const even = (n: number) => ({ top: n, right: n, bottom: n, left: n });
// 晕画在盒子外面要留多少：松的那档模糊约 4σ 才淡尽；鼠标划过时墨还会被推出去几十 px，至少留 56
const bleedPadding = (loose: number) => Math.max(56, Math.ceil(loose * 4));

// 标志：盒子 = 墨迹框（MARK_INK_BOX，196×228 个用户单位）。参数沿用 SVG 版、按盒子换算成 px
const MARK_BOX = { x: 282, y: 96, width: 196, height: 228 };
const markPaths = () => MARK_PATHS.map((d) => new Path2D(d));

// 把标志画进 (x, y) 处、每个用户单位 u px 的墨迹框里
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, u: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(u, u);
  ctx.translate(-MARK_BOX.x, -MARK_BOX.y);
  ctx.translate(210, 27);
  ctx.scale(6.6, 6.6);
  markPaths().forEach((path) => ctx.fill(path));
  ctx.restore();
}

// 标志化开的参数（按每个用户单位 u px 换算）
const markParams = (u: number) => ({
  tight: 4 * u,
  loose: 15 * u,
  displacement: 4 * u,
  warpFrequency: 0.011 / u,
  weightFrequency: 0.005 / u,
  // 上紧下松：「i」的点和三角的尖清楚，底部淌开（用户确认过的化开方式）
  spreadBias: 0.9,
});

// 显影时水落下的点：标志中部偏上（对应 SVG 版的 380,210），相对墨迹框
const markDrop = (u: number) => ({ x: (380 - MARK_BOX.x) * u, y: (210 - MARK_BOX.y) * u });

function buildMark(width: number, height: number): InkSpec {
  const u = height / MARK_BOX.height;
  return {
    padding: even(bleedPadding(15 * u)),
    draw: (ctx) => drawMark(ctx, 0, 0, u),
    params: {
      ...markParams(u),
      reveal: { ...markDrop(u), radius: Math.max(width, height) * 1.15 },
    },
  };
}

/** L·i 标志的化开状态。盒子就是墨迹本身，晕画在盒子外面 */
export function InkMark({ className, label }: { className?: string; label?: string }) {
  return (
    <InkSurface
      className={className}
      label={label}
      tables={MARK_TABLES}
      build={buildMark}
      buildKey="mark"
      fallback={<InkMarkSvg viewBox={MARK_INK_BOX} bleed className="h-full w-full" />}
    />
  );
}

// 单词：字号 208 个单位时的字形框（前进宽度 × 上沿到基线下 8）。字体加载完才量得准。
//
// 光学尺寸：SVG 版用 opsz 30（笔画粗细更匀，细笔不会被模糊吃断）。画布文字设不了
// font-variation-settings，但 Fraunces 的 opsz 会按字号自动选 —— 所以永远用 30px 的字号
// 画和量，再整体缩放到需要的大小，拿到的就是 opsz 30 的字形。
const OPSZ_SIZE = 30;
const fontFamily = () =>
  getComputedStyle(document.body).getPropertyValue("--font-fraunces").trim() || "Georgia, serif";

function wordFont(size: number) {
  return `italic 600 ${size}px ${fontFamily()}`;
}

function measureWord(word: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.font = wordFont(OPSZ_SIZE);
  ctx.letterSpacing = `${-0.02 * OPSZ_SIZE}px`;
  const m = ctx.measureText(word);
  // 换算回 208 个单位的字号；描边（5 个单位）会让字形左右各胖出一点，一并算进宽度
  const k = WORD_FONT_SIZE / OPSZ_SIZE;
  const ascent = m.fontBoundingBoxAscent * k;
  return { width: m.width * k + 5, ascent, height: ascent + WORD_BASELINE_PAD };
}

/** 口号里化开的那个词。盒子 = 字形框，宽度由外面给、高度按比例 */
export function InkWord({ word, className }: { word: string; className?: string }) {
  const [metrics, setMetrics] = useState<{ width: number; ascent: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setMetrics(measureWord(word));
    });
    return () => {
      cancelled = true;
    };
  }, [word]);

  const box = metrics ?? estimateBox(word);
  const ascent = metrics?.ascent ?? WORD_BASELINE - 14;

  const build = (width: number, height: number): InkSpec => {
    const u = height / box.height;
    return {
      padding: even(bleedPadding(9 * u)),
      draw: (ctx) => {
        if (!metrics) return;
        // 按 30px 字号画（取 opsz 30 的字形），再放大到 208 个单位 × u
        const k = (WORD_FONT_SIZE / OPSZ_SIZE) * u;
        ctx.scale(k, k);
        ctx.font = wordFont(OPSZ_SIZE);
        ctx.letterSpacing = `${-0.02 * OPSZ_SIZE}px`;
        ctx.textBaseline = "alphabetic";
        // 同色圆角描边加厚，与 SVG 版一致（5 个单位）
        ctx.lineWidth = (5 * OPSZ_SIZE) / WORD_FONT_SIZE;
        ctx.lineJoin = "round";
        const baseline = (ascent * OPSZ_SIZE) / WORD_FONT_SIZE;
        ctx.fillText(word, 2.5 / (WORD_FONT_SIZE / OPSZ_SIZE), baseline);
        ctx.strokeText(word, 2.5 / (WORD_FONT_SIZE / OPSZ_SIZE), baseline);
      },
      params: {
        // 比 SVG 版（3 / 12）收一档：字的笔画比标志细得多，晕太宽时墨芯不够黑，颗粒会把蓝色带进笔画里
        tight: 2.5 * u,
        loose: 9 * u,
        displacement: 3 * u,
        warpFrequency: 0.011 / u,
        weightFrequency: 0.005 / u,
        spreadBias: 0,
        reveal: { x: width / 2, y: height / 2, radius: width * 0.9 },
        // 只有一行字高，细笔画经不起半分辨率
        blurScale: 1,
      },
    };
  };

  return (
    <InkSurface
      className={className}
      style={{ aspectRatio: `${box.width} / ${box.height}` }}
      tables={WORD_TABLES}
      build={build}
      buildKey={metrics ? `${word}:${box.width}` : `${word}:pending`}
      fallback={<InkWordSvg word={word} className="h-full w-full" />}
    />
  );
}

// ── 首屏：标志和墨线画在同一块画布上 ──────────────────────────────────
//
// 墨线是从标志里流出来的：两者共用一套模糊和噪声，交接处的晕自然连成一片（用户的示意图：
// 横线流进「i」那一笔斜竖，竖笔上方是 i 的点）。墨线右端算在竖笔的中线上，藏进竖笔的墨里。
//
// 墨线的样子是用户选的 B：墨芯很细，晕和标志一样宽 —— 一道彩色光带，中间一丝细墨。
// 所以它分两层画：
//   晕：一条竖向渐变的灰带（中间约 Cobalt 的明暗，往两边淡到纸），模糊后给出两侧对称的彩边；
//       不能直接画一条细黑线去模糊 —— 细于模糊半径的墨会被整体冲淡，出不来彩边。
//   芯：一条几 px 的黑线，外面裹一圈很窄的渐变（Cobalt → Cyan），画进 core 层，不参与化开。
//       保证中间那一丝墨始终在，而且墨芯外面先是蓝、再往外才是暖色 —— 与标志笔画的色序一致。
//
// 位置从页面里的两个占位元素读：[data-ink="mark"]（墨迹框）与 [data-ink="line"]（墨线所在的那一行，
// 线画在它的竖向中线上）。画布铺满首屏，所以排版只管摆占位，形状跟着占位走。

// 「i」竖笔中线（标志路径坐标）：上端 (22.8, 19.3)，每往下 1 个单位往左 0.315
const STEM = { x: 22.8, y: 19.3, slope: -0.315, minY: 21, maxY: 43 };
// 墨线晕带的半高（每用户单位）、中心的墨量（0–1，1 = 纯墨）与往两边淡出的曲线
const LINE_BAND = 20;
const LINE_PEAK = 0.68;
const LINE_FALLOFF = 1.4;
// 墨芯的粗细（CSS px）；裹在外面那圈渐变的半宽（每用户单位）与贴着墨芯处的明暗（0.34 ≈ Cobalt）
const LINE_CORE = 4;
const LINE_HALO = 7;
const LINE_HALO_INNER = 0.34;
// 窄屏不显示标志时的尺度（px / 用户单位），与 1440 宽时标志的尺度相近
const FALLBACK_UNIT = 2.6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// 以 y 为中线、上下各 half 的竖向灰度渐变；value(d) 给出离中线 d（0–1）处的明暗（0 = 墨、1 = 纸）
function verticalGradient(ctx: CanvasRenderingContext2D, y: number, half: number, value: (d: number) => number) {
  const gradient = ctx.createLinearGradient(0, y - half, 0, y + half);
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const gray = Math.round(255 * clamp(value(Math.abs(2 * t - 1)), 0, 1));
    gradient.addColorStop(t, `rgb(${gray},${gray},${gray})`);
  }
  return gradient;
}

// 首屏的占位在宽屏和窄屏各有一套（位置不同，用 CSS 二选一显示）：取当前显示着的那个
function heroSlots(box: HTMLElement) {
  const root = box.parentElement;
  const shown = (name: string) =>
    [...(root?.querySelectorAll<HTMLElement>(`[data-ink="${name}"]`) ?? [])].find((el) => el.getClientRects().length > 0) ?? null;
  return { mark: shown("mark"), line: shown("line") };
}

function relativeRect(element: Element | null, box: DOMRect) {
  if (!element) return null;
  const r = element.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return { x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height };
}

// 「i」竖笔的中线在高度 y 处的 x（画布坐标）：墨线流进标志时，末端藏在这一笔的墨里。
// mark 是墨迹框的位置，u 是每个用户单位多少 px
function markStemX(mark: { x: number; y: number }, u: number, y: number) {
  const py = clamp(((y - mark.y) / u + MARK_BOX.y - 27) / 6.6, STEM.minY, STEM.maxY);
  const px = STEM.x + (py - STEM.y) * STEM.slope;
  return mark.x + (210 + 6.6 * px - MARK_BOX.x) * u;
}

// 首屏墨线的晕沿线被盖掉多少：[位置 0–1（左缘 → 标志）, 盖掉的比例]
const LINE_FADE: [number, number][] = [
  [0, 1],
  [0.2, 0.85],
  [0.5, 0.5],
  [0.8, 0.18],
  [1, 0],
];

function buildHero(width: number, height: number, box: HTMLElement): InkSpec {
  const boxRect = box.getBoundingClientRect();
  const slots = heroSlots(box);
  // lg 以下标志的占位是 display: none，量出来是空的
  const mark = relativeRect(slots.mark, boxRect);
  const line = relativeRect(slots.line, boxRect);
  const u = mark ? mark.height / MARK_BOX.height : FALLBACK_UNIT;
  const lineY = line ? line.y + line.height / 2 : null;

  // 墨线右端：「i」竖笔中线在这一高度上的 x；没有标志时一直画出右缘
  let lineEnd = width + 200;
  if (mark && lineY !== null) lineEnd = markStemX(mark, u, lineY);

  // 显影：水落在标志上，漫开时顺着墨线往左流出去；没有标志时从墨线右端开始
  const drop = mark
    ? { x: mark.x + markDrop(u).x, y: mark.y + markDrop(u).y }
    : { x: width, y: lineY ?? height / 2 };
  const corners = mark
    ? [
        [mark.x, mark.y],
        [mark.x + mark.width, mark.y + mark.height],
        [mark.x, mark.y + mark.height],
      ]
    : [];
  const reach = Math.max(
    lineY !== null ? Math.hypot(drop.x, drop.y - lineY) : 0,
    ...corners.map(([x, y]) => Math.hypot(x - drop.x, y - drop.y)),
  );

  return {
    padding: even(0),
    draw: (ctx) => {
      // 先画墨线的晕带，再画标志：交接处标志的墨盖在晕带上面
      if (lineY !== null) {
        const band = LINE_BAND * u;
        ctx.fillStyle = verticalGradient(ctx, lineY, band, (d) => 1 - LINE_PEAK * Math.pow(1 - d, LINE_FALLOFF));
        ctx.fillRect(-200, lineY - band, lineEnd + 200, band * 2);
        // 晕不是一路均匀：越往左越收，到左缘只剩墨芯和贴着它的一圈（和 Work 那根线一个样子），
        // 越靠近标志化得越开 —— 线是「流进标志才化开」的，不是一根通体发光的灯管。
        // 做法：用一层从左（不透明）到右（透明）的纸色盖掉晕带。没有标志时（窄屏）线只是分隔，保持均匀
        if (mark) {
          const fade = ctx.createLinearGradient(0, 0, lineEnd, 0);
          for (const [stop, alpha] of LINE_FADE) fade.addColorStop(stop, `rgba(255,255,255,${alpha})`);
          ctx.fillStyle = fade;
          ctx.fillRect(-200, lineY - band, lineEnd + 200, band * 2);
        }
        ctx.fillStyle = "#000";
      }
      if (mark) drawMark(ctx, mark.x, mark.y, u);
    },
    drawCore: (ctx) => {
      if (lineY === null) return;
      const halo = LINE_HALO * u;
      ctx.fillStyle = verticalGradient(ctx, lineY, halo, (d) => LINE_HALO_INNER + (1 - LINE_HALO_INNER) * Math.pow(d, 0.8));
      ctx.fillRect(-200, lineY - halo, lineEnd + 200, halo * 2);
      // 贴着墨芯的那圈彩边也跟着往左收（收得比晕少一些，留一点颜色），左端才像 Work 那根素线
      if (mark) {
        const fade = ctx.createLinearGradient(0, 0, lineEnd, 0);
        for (const [stop, alpha] of LINE_FADE) fade.addColorStop(stop, `rgba(255,255,255,${alpha * 0.75})`);
        ctx.fillStyle = fade;
        ctx.fillRect(-200, lineY - halo, lineEnd + 200, halo * 2);
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(-200, lineY - LINE_CORE / 2, lineEnd + 200, LINE_CORE);

    },
    params: {
      ...markParams(u),
      // 小标志（手机）化开得收紧一些：按比例缩下来的晕会把「i」的点这类小形状吃成一个空心圈
      ...(u < 2 ? { tight: 4 * u * Math.max(0.55, u / 2), displacement: 4 * u * Math.max(0.55, u / 2) } : null),
      reveal: { ...drop, radius: reach * 1.1 },
    },
  };
}

function heroWatch(box: HTMLElement) {
  const { mark, line } = heroSlots(box);
  // 墨线上面的口号变高（字体加载完）时，墨线只是被往下推，自己的尺寸不变 —— 也要看着它
  return [mark, line, line?.previousElementSibling ?? null];
}

/**
 * 首屏的化开画布：铺满父元素（首屏 section），按父元素里 InkMarkSlot / InkLineSlot 的位置
 * 画标志和墨线。不支持 WebGL 时不渲染，由两个占位自己显示 SVG 兜底。
 */
export function HeroInk({ className }: { className?: string }) {
  const supported = useInkSupported();
  if (!supported) return null;
  return (
    <InkSurface
      className={className}
      tables={MARK_TABLES}
      build={buildHero}
      buildKey="hero"
      watch={heroWatch}
      fallback={null}
    />
  );
}

/** 首屏标志的占位：盒子 = 墨迹框。WebGL 画在 HeroInk 上；不支持时这里显示 SVG 兜底 */
export function InkMarkSlot({ className, label }: { className?: string; label?: string }) {
  const supported = useInkSupported();
  return (
    <div data-ink="mark" role={label ? "img" : undefined} aria-label={label} className={className}>
      {supported ? null : <InkMarkSvg viewBox={MARK_INK_BOX} bleed className="h-full w-full" />}
    </div>
  );
}

/** 首屏墨线的占位：线画在这一行的竖向中线上，左端贴到视口左缘、右端流进标志 */
export function InkLineSlot({ className }: { className?: string }) {
  const supported = useInkSupported();
  return (
    <div data-ink="line" aria-hidden="true" className={cn("relative", className)}>
      {supported ? null : <InkLineSvg className="absolute inset-x-0 bottom-1/2 h-[22px]" />}
    </div>
  );
}
