"use client";

// 化开效果的 SVG 兜底：只在浏览器不支持 WebGL2 时出现（ui/ink-mark.tsx 按需加载这个文件，
// 绝大多数访客不会下载它）。静态的 —— SVG 滤镜在 CPU 上算，任何动画都会让它每帧重算，所以兜底时不显影、不流动。
// 识别案例页「五色」一章的两块样稿（纸上、夜里）底色固定，兜底时用 mode 固定色表，不跟主题走。
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
// 坐标系沿用手册封面的比例：标志放大 9.3 倍（MARK_UNIT），左上角在原点，约 324 × 326 个单位。
// 模糊半径等参数都是按这个比例调的。要放大缩小就缩放整个 <svg>，不要改这些数。
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  COLOR_TABLES,
  MARK_BOUNDS,
  MARK_PATH,
  MARK_UNIT,
  MARK_USER_SIZE,
  WORD_BASELINE,
  WORD_BASELINE_PAD,
  WORD_FONT_SIZE,
  estimateBox,
} from "./ink-tables";

type Mode = keyof typeof COLOR_TABLES;

// 滤镜与遮罩的作用范围：比图形大一圈，否则边缘会被裁出硬边
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
  reveal: { cx: MARK_USER_SIZE.width / 2, cy: MARK_USER_SIZE.height * 0.42, r: 460 },
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
          {/* 3. 权重噪声：决定哪里收得紧、哪里渗得开。seed 58 和手册示意稿是同一张，换之前先看效果 */}
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
  <g transform={`scale(${MARK_UNIT}) translate(${-MARK_BOUNDS.x},${-MARK_BOUNDS.y})`} fill="#000">
    <path fillRule="evenodd" d={MARK_PATH} />
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
  /**
   * 固定用哪张色表（light = 纸上，dark = 夜里），不跟主题走。给底色固定的样稿用（识别案例页的「五色」）。
   * 不传时两种主题各渲染一份，由主题决定显示哪份。
   */
  mode?: Mode;
};

function Ink({
  className,
  viewBox,
  shape,
  coarse = true,
  reveal = true,
  seep = false,
  label,
  mode,
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
      {mode ? (
        <Bloom {...shared} mode={mode} className="h-full w-full">
          {children}
        </Bloom>
      ) : (
        <>
          <Bloom {...shared} mode="light" className="only-light h-full w-full">
            {children}
          </Bloom>
          <Bloom {...shared} mode="dark" className="only-dark h-full w-full">
            {children}
          </Bloom>
        </>
      )}
    </div>
  );
}

/** 雨标志的化开状态（SVG 兜底） */
export function InkMarkSvg({
  viewBox = "-88 -47 500 420",
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
// 字形：Fraunces 正体（斜体留给口号里的 ordinary，手册 06）、opsz 30（笔画粗细更匀，细笔不会被模糊吃断）、
// 同色圆角描边加厚。字号 208 是用户坐标，放大缩小靠缩放整个 <svg>。
//
// 取景 = 字形本身：左缘是第一个字母、右缘是最后一个字母、下缘是基线，上缘是字体的上沿。
// 晕画在盒子外面（bleed）。所以排版时直接按这个盒子对齐，不需要再用负边距抵掉留白。
// 盒子的比例要等字体加载完、量过实际字形后才知道；量到之前先用估计值。
export function InkWordSvg({ word, ...props }: InkProps & { word: string }) {
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
export function InkLineSvg({ className }: { className?: string }) {
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
