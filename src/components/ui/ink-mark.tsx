"use client";

// 化开的元素：L·i 标志、首屏口号里的单词、从标志流出来的墨线（品牌手册第 02–04、08 章）。
//
// 对外的 InkMark / InkWord / HeroInk 用 WebGL 渲染（ui/ink/）：持续流动、呼吸，鼠标划过像筷子
// 划开汤里的油，而且不掉帧。本文件下半部分的 SVG 滤镜版本只在浏览器不支持 WebGL2 时作为静态兜底出现 ——
// 它在 CPU 上算，任何动画都会让它每帧重算，所以兜底时不显影、不流动。
//
// ── 以下是 SVG 兜底的说明 ──
//
// 原理：源图是「白底 + 黑色标志」，经过
//   位移（让边缘不规则）→ 两份不同程度的模糊按一张低频噪声逐像素混合（有的地方收得紧、
//   有的地方渗成一片，而不是一圈等宽的彩边）→ 叠颗粒 → 用查找表把明暗映射成颜色
//   （0 = 墨芯，中间依次是 Core / Cobalt / Cyan / Amber / Coral，1 = 背景）。
// 背景是透明的：明暗值同时被写进 alpha，晕的最外一段直接淡出到透明，露出页面自己的底色。
// 早先的做法是让查找表的末端等于页面底色（纸 / 墨），但滤镜输出和 CSS 颜色在广色域屏幕上
// 走的色彩管理路径不同，同一个色值会渲染出看得见的色差，图的矩形边界就露出来了。
// 透明之后它可以放在任何表面上。
//
// 颗粒的粗细按实际显示尺寸换算（见 useDisplayScale）：滤镜参数写在用户坐标里，
// 图放大三倍，颗粒也会跟着放大三倍变成马赛克；这里让颗粒在屏幕上保持差不多的大小。
//
// 两种主题各渲染一份，由 globals.css 的 .only-light / .only-dark 决定显示哪份：
// 这样首帧就是对的主题，不必等 JS 读到主题再切（那会先闪一下另一种底色的方框）。
//
// 坐标系沿用手册示意稿：标志按 translate(210,27) scale(6.6) 画在 760×420 的画布上，
// 模糊半径等参数都是按这个比例调的。要放大缩小就缩放整个 <svg>，不要改这些数。
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { COLOR_TABLES, MARK_PATHS } from "./ink/ink-tables";
import { InkSurface, useInkSupported, type InkSpec } from "./ink/ink-surface";

type Mode = keyof typeof COLOR_TABLES;

// 滤镜与遮罩的作用范围：比画布大一圈，否则边缘会被裁出硬边
const REGION = { x: -300, y: -300, width: 1600, height: 1300 };
// 实际显示的范围：比滤镜区域再收进一圈。模糊在区域边缘会混进区域外的透明黑，
// 那一圈算出来不是纯背景，会显出一道色带。平时被 viewBox 裁掉看不到；bleed 时要靠这里裁
const INSET = 90;
type Region = { x: number; y: number; width: number; height: number };
const insetRegion = (region: Region, inset: number): Region => ({
  x: region.x + inset,
  y: region.y + inset,
  width: region.width - inset * 2,
  height: region.height - inset * 2,
});

// 颗粒的基准：手册示意稿里确认过观感的那个显示比例（1 个用户单位 ≈ 1.2 px）
const REFERENCE_SCALE = 1.2;

type Shape = {
  /** 位移强度：边缘的不规则程度 */
  displacement: number;
  /** 两份模糊：收得紧的和渗得开的 */
  tight: number;
  loose: number;
  /** 显影：水从这一点落下，湿的边界漫到这个半径时盖住整个图形 */
  reveal: { cx: number; cy: number; r: number };
  /** 滤镜作用范围与可见范围的收进量。默认按标志和单词的画布定；细长的墨线要按自己的尺寸给 */
  region?: Region;
  inset?: number;
};

const MARK_SHAPE: Shape = {
  displacement: 8,
  tight: 4,
  loose: 15,
  reveal: { cx: 380, cy: 210, r: 460 },
};

// 实际显示时 1 个用户单位等于多少 px：按 preserveAspectRatio="meet" 的规则取较小的那个比例。
// 量出来之前先用基准值，首帧的颗粒就是手册里的样子。
function useDisplayScale(viewBox: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(REFERENCE_SCALE);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const [, , width, height] = viewBox.split(/\s+/).map(Number);

    const update = () => {
      const next = Math.min(element.clientWidth / width, element.clientHeight / height);
      // 取一位小数：尺寸微调时不必每次都重建滤镜
      if (next > 0) setScale(Math.round(next * 10) / 10);
    };

    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [viewBox]);

  return [ref, scale] as const;
}

function Bloom({
  mode,
  uid,
  viewBox,
  shape,
  displayScale,
  coarse,
  reveal,
  seep,
  label,
  className,
  bleed = false,
  children,
}: {
  bleed?: boolean;
  mode: Mode;
  uid: string;
  viewBox: string;
  shape: Shape;
  displayScale: number;
  coarse: boolean;
  reveal: boolean;
  seep: boolean;
  label?: string;
  className: string;
  /** 源图形：黑色，画在白底上（白底由这里提供） */
  children: ReactNode;
}) {
  const filterId = `${uid}-${mode}-bloom`;
  const wetId = `${uid}-${mode}-wet`;
  const maskId = `${uid}-${mode}-mask`;
  const [r, g, b, a] = COLOR_TABLES[mode];
  const { displacement, tight, loose } = shape;
  const region = shape.region ?? REGION;
  const visible = insetRegion(region, shape.inset ?? INSET);
  // 图放大多少倍，颗粒频率就提高多少倍，屏幕上的颗粒大小保持不变
  const grainFrequency = (base: number) =>
    Math.min(4, Math.max(0.4, (base * displayScale) / REFERENCE_SCALE)).toFixed(2);

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      // bleed：盒子只框住字形本身，晕画在盒子外面。这样排版时盒子的边就是字的边
      style={bleed ? { overflow: "visible" } : undefined}
    >
      <defs>
        <filter id={filterId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB" {...region}>
          {/* 1. 位移：边缘不规则。seep 时缓慢起伏，就是成形后的「洇」 */}
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="7" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={displacement} xChannelSelector="R" yChannelSelector="G" result="displaced">
            {seep ? (
              <animate
                attributeName="scale"
                values={`${displacement};${displacement + 6};${displacement}`}
                dur="11s"
                repeatCount="indefinite"
              />
            ) : null}
          </feDisplacementMap>
          {/* 2. 两份模糊：紧（b1）与松（b2） */}
          <feGaussianBlur in="displaced" stdDeviation={tight} result="tight" />
          <feGaussianBlur in="displaced" stdDeviation={coarse ? loose : loose * 0.73} result="loose" />
          {/* 3. 权重噪声：决定哪里收得紧、哪里渗得开。seed 58 是「上紧下松」，换之前先看效果 */}
          <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="2" seed="58" result="weightNoise" />
          <feColorMatrix
            in="weightNoise"
            type="matrix"
            values="3.5 0 0 0 -1.23  3.5 0 0 0 -1.23  3.5 0 0 0 -1.23  0 0 0 0 1"
            result="weight"
          />
          <feComponentTransfer in="weight" result="weightInverse">
            <feFuncR type="table" tableValues="1 0" />
            <feFuncG type="table" tableValues="1 0" />
            <feFuncB type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feComposite in="loose" in2="weight" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="looseWeighted" />
          <feComposite in="tight" in2="weightInverse" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="tightWeighted" />
          <feComposite in="looseWeighted" in2="tightWeighted" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="mixed" />
          {/* 4. 颗粒（晕）：粗的给大尺寸，细的给小尺寸 */}
          {coarse ? (
            <>
              <feTurbulence type="fractalNoise" baseFrequency={grainFrequency(0.8)} numOctaves="1" seed="3" result="grainNoise" />
              <feColorMatrix in="grainNoise" type="matrix" values="1 1 1 0 -1 1 1 1 0 -1 1 1 1 0 -1 0 0 0 0 1" result="grain" />
              <feComposite in="mixed" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0.18" k4="-0.09" result="grained" />
            </>
          ) : (
            <>
              <feTurbulence type="fractalNoise" baseFrequency={grainFrequency(0.9)} numOctaves="2" seed="3" result="grainNoise" />
              <feColorMatrix
                in="grainNoise"
                type="matrix"
                values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1"
                result="grain"
              />
              <feComposite in="mixed" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0.08" k4="-0.04" result="grained" />
            </>
          )}
          {/* 5. 把明暗值也写进 alpha（取 1 − 明暗值）。取反是为了精度：滤镜内部是预乘的 8 位色，
              alpha 很小时 RGB 会被量化得很粗；取反后墨芯和内圈颜色的 alpha 接近 1，只有本来就要
              淡出的最外一圈落在低 alpha 区。 */}
          <feColorMatrix
            in="grained"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 0 0 0 1"
            result="valued"
          />
          {/* 6. 明暗 → 五色；alpha 表让最外一段淡出到透明 */}
          <feComponentTransfer in="valued">
            <feFuncR type="table" tableValues={r} />
            <feFuncG type="table" tableValues={g} />
            <feFuncB type="table" tableValues={b} />
            <feFuncA type="table" tableValues={a} />
          </feComponentTransfer>
        </filter>

        {reveal ? (
          <>
            {/* 显影的水渍前沿：一个被噪声扭曲、再模糊的圆，边界不规则而柔软 */}
            <filter id={wetId} filterUnits="userSpaceOnUse" x="-600" y="-600" width="2200" height="1900">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="11" result="wetNoise" />
              <feDisplacementMap in="SourceGraphic" in2="wetNoise" scale="140" xChannelSelector="R" yChannelSelector="G" />
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <mask id={maskId} maskUnits="userSpaceOnUse" {...region}>
              <circle cx={shape.reveal.cx} cy={shape.reveal.cy} r={shape.reveal.r} fill="#fff" filter={`url(#${wetId})`}>
                {/* 前 18% 停顿，之后接近匀速地漫开；只播一次并停在终点 */}
                <animate
                  attributeName="r"
                  values={`0;0;${shape.reveal.r}`}
                  keyTimes="0;0.18;1"
                  calcMode="spline"
                  keySplines="0 0 1 1;0.35 0.2 0.5 1"
                  dur="4.4s"
                  fill="freeze"
                />
              </circle>
            </mask>
          </>
        ) : null}
      </defs>

      <clipPath id={`${uid}-${mode}-clip`}>
        <rect {...visible} />
      </clipPath>
      <g clipPath={`url(#${uid}-${mode}-clip)`} mask={reveal ? `url(#${maskId})` : undefined}>
        <g filter={`url(#${filterId})`}>
          <rect {...region} fill="#fff" />
          {children}
        </g>
      </g>
    </svg>
  );
}

const markSource = (
  <g transform="translate(210,27) scale(6.6)" fill="#000">
    {MARK_PATHS.map((d) => (
      <path key={d} d={d} />
    ))}
  </g>
);

type InkProps = {
  className?: string;
  /** 粗颗粒（大尺寸）或细颗粒（小尺寸） */
  coarse?: boolean;
  /** 显影入场：图形起初藏在纸里，水从一点漫开才显出来 */
  reveal?: boolean;
  /** 成形后边缘继续缓慢渗动。会让滤镜每帧重算，面积大时开销高 */
  seep?: boolean;
  /** 给读屏的名称；纯装饰时不传 */
  label?: string;
};

function Ink({
  className,
  viewBox,
  shape,
  coarse = true,
  reveal = true,
  seep = false,
  label,
  children,
  style,
  bleed = false,
}: InkProps & {
  viewBox: string;
  shape: Shape;
  children: ReactNode;
  style?: CSSProperties;
  bleed?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  // 减弱动画：没有水，直接显示已经化开的静止画面
  const reducedMotion = usePrefersReducedMotion();
  const [ref, displayScale] = useDisplayScale(viewBox);
  const shared = {
    uid,
    viewBox,
    shape,
    displayScale,
    coarse,
    reveal: reveal && !reducedMotion,
    seep: seep && !reducedMotion,
    label,
    bleed,
  };

  return (
    <div ref={ref} className={cn("pointer-events-none select-none", className)} style={style}>
      <Bloom {...shared} mode="light" className="only-light h-full w-full">
        {children}
      </Bloom>
      <Bloom {...shared} mode="dark" className="only-dark h-full w-full">
        {children}
      </Bloom>
    </div>
  );
}

// 标志墨迹本身的外框（用户坐标）：路径范围 x 10.97–40.6、y 10.48–45.03，
// 经 translate(210,27) scale(6.6) 换算而来。配合 bleed 使用：盒子的边就是墨迹的边。
export const MARK_INK_BOX = "282 96 196 228";

/** L·i 标志的化开状态（SVG 兜底） */
function InkMarkSvg({
  viewBox = "130 0 500 420",
  bleed = false,
  ...props
}: InkProps & {
  /** 取景：默认把标志连同四周的晕框在中间。想让标志被画面裁切，就改这里而不是改滤镜 */
  viewBox?: string;
  /** 晕画在盒子外面。配合 MARK_INK_BOX，排版时可以直接按墨迹的边对齐 */
  bleed?: boolean;
}) {
  return (
    <Ink {...props} reveal={false} bleed={bleed} viewBox={viewBox} shape={MARK_SHAPE}>
      {markSource}
    </Ink>
  );
}

// ── 化开的单词：首页口号里的 color / colore ──
// 品牌手册的例外：首屏里口号的这个词和标志一起化开；其余地方文字都不化开。
// 字形取之前讨论里最后停在的那一组：Fraunces 斜体、opsz 30（笔画粗细更匀，细笔不会被模糊吃断）、
// 同色圆角描边加厚。字号 208 是用户坐标，放大缩小靠缩放整个 <svg>。
//
// 取景 = 字形本身：左缘是第一个字母、右缘是最后一个字母、下缘是基线，上缘是字体的上沿。
// 晕画在盒子外面（bleed）。所以排版时直接按这个盒子对齐，不需要再用负边距抵掉留白。
// 盒子的比例要等字体加载完、量过实际字形后才知道；量到之前先用估计值。
const WORD_FONT_SIZE = 208;
const WORD_BASELINE = 212;
// 基线下面留一点，给描边和斜体的下摆
const WORD_BASELINE_PAD = 8;
// 量到真实宽度之前的估计：每个字母约 0.5 个字号
const estimateBox = (word: string) => ({
  x: 0,
  y: 14,
  width: Math.round(word.length * WORD_FONT_SIZE * 0.5),
  height: WORD_BASELINE + WORD_BASELINE_PAD - 14,
});

function InkWordSvg({ word, ...props }: InkProps & { word: string }) {
  // 浅色、深色各渲染一份，当前主题下隐藏的那份（display: none）量不出尺寸，所以两份都收集
  const textsRef = useRef(new Set<SVGTextElement>());
  const [box, setBox] = useState(() => estimateBox(word));

  useEffect(() => {
    let cancelled = false;
    // Fraunces 由 next/font 加载；没加载完时量到的是后备字体的宽度
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const boxes = [...textsRef.current].filter((t) => t.isConnected).map((t) => t.getBBox());
      const b = boxes.find((candidate) => candidate.width > 0);
      if (!b) return;
      setBox({
        x: Math.floor(b.x),
        y: Math.floor(b.y),
        width: Math.ceil(b.width),
        height: Math.ceil(WORD_BASELINE + WORD_BASELINE_PAD - b.y),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [word]);

  // 比标志的晕收一些（字比标志细），但不能太紧：太紧就成了一圈等宽的描边。
  // 松的那份取 12：14 会把 e 这类小字怀填满（意大利语 colore 的 e 糊成一团），10 又窄得像描边
  const shape: Shape = {
    displacement: 7,
    tight: 3,
    loose: 12,
    reveal: { cx: box.x + box.width / 2, cy: box.y + box.height / 2, r: box.width * 0.8 },
  };

  return (
    <Ink
      {...props}
      reveal={false}
      bleed
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      shape={shape}
      // 容器按字形比例定高：宽度由外面给，高度跟着走
      style={{ aspectRatio: `${box.width} / ${box.height}` }}
    >
      <text
        ref={(el) => {
          if (el) textsRef.current.add(el);
        }}
        x={0}
        y={WORD_BASELINE}
        fill="#000"
        stroke="#000"
        strokeWidth={5}
        strokeLinejoin="round"
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: WORD_FONT_SIZE,
          fontStyle: "italic",
          fontWeight: 600,
          fontVariationSettings: '"opsz" 30',
          letterSpacing: "-0.02em",
        }}
      >
        {word}
      </text>
    </Ink>
  );
}

// ── 墨线：从标志里流出来的一道墨（首页首屏） ──
// 做法照用户在 Figma 里的那条线：它是标志笔画边缘的一个切片 —— 上面是晕（Coral → Cobalt），
// 下面是墨芯，下沿被直接切断，不对称。
// 所以这里画的是一道粗笔画（墨芯从盒子中部往下伸出盒子），盒子只露出它的上边缘。
// 不能用一根细线代替：墨芯细于模糊半径时会被整体冲淡，出不来「墨芯 + 彩边」的层次。
// 坐标按像素取（viewBox = 盒子的实际宽高，颗粒 1:1 显示）；滤镜区域按线的尺寸现算 ——
// 标志那套固定的 1600×1300 区域装不下一条横贯全屏的线。
// 芯和标志一样是墨色（深色模式也是墨芯）：它是标志的一部分，不是文字。
function InkLineSvg({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1200, height: 22 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const width = Math.round(element.clientWidth);
      const height = Math.round(element.clientHeight);
      if (width > 0 && height > 0) setSize({ width, height });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;
  // 晕的尺度与首屏上的标志一致：标志的滤镜参数（位移 8、模糊 4 / 15）乘以它在首屏上的
  // 显示比例（约 2 px/单位），这样墨线看起来是从同一滴墨里切下来的，而不是另一种更细的效果。
  // 笔画上沿放在盒子 3/4 处：上面 3/4 露出晕（Coral → Cyan → Cobalt），下面 1/4 是墨芯；
  // 笔画再往下伸出盒子，被 viewBox 裁掉
  const strokeTop = Math.round(height * 0.75);
  const strokeHeight = 120;
  const pad = 100;
  const shape: Shape = {
    displacement: 16,
    tight: 8,
    loose: 30,
    reveal: { cx: width, cy: height / 2, r: width },
    region: { x: -pad, y: -pad, width: width + pad * 2, height: strokeTop + strokeHeight + pad * 2 },
    // 不额外裁：盒子（viewBox）本身就把区域边缘的色带裁在外面了
    inset: 0,
  };

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <Ink viewBox={`0 0 ${width} ${height}`} shape={shape} reveal={false} className="h-full w-full">
        <rect x={-pad} y={strokeTop} width={width + pad * 2} height={strokeHeight} fill="#000" />
      </Ink>
    </div>
  );
}

// ── WebGL 版本（对外） ─────────────────────────────────────────────────

const MARK_TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };
// 单词和标志用同一张表：深色模式下芯也是墨色，像日食 —— 墨字压在夜色上，靠一圈彩边显出来（用户 2026-11-15 定）
const WORD_TABLES = MARK_TABLES;

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
