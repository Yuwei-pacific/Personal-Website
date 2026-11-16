// 社交分享图（Open Graph）：1200×630 PNG，按品牌手册 10「分享图 · 夜里 · 标志化开」。
// 墨底，右边是化开的 L·i 标志，左边只有名字（Fraunces）和一行等宽的身份说明 —— 没有别的东西。
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { locales } from "@/i18n/config";
import { MARK_PATHS } from "@/components/ui/ink/ink-tables";
import { SITE_AUTHOR, SITE_ROLE, SITE_TITLE } from "@/lib/site-metadata";

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse 跑不了首页的 WebGL 画布，这里用手册里那套 SVG 滤镜画静止的一帧：
// 标志先被低频噪声推歪一点，糊成一紧一松两层，再按另一层噪声混合（有的地方收得紧、有的地方渗得开），
// 加颗粒，最后查表上色 —— 表里依次是 墨芯 → Cobalt → Cyan → Amber → Coral → 夜里的纸。
// 画在 760×399 的坐标里（手册的画板），整体放大到 1200×630。
// 颜色和网站深色模式的标志一致（ui/ink/ink-tables.ts 的 dark 表）：纸色的芯，往外是 Cobalt → Cyan → Amber → Coral，
// 最后落回墨色的底。
// 这张 SVG 四周各多画 BLEED 个单位、再被外层裁掉：渲染器只在画布范围内算滤镜，画布边缘会被当成
// 形状的边，糊出一圈彩边（实测）。多画的那一圈把这道假边推到看不见的地方。
const BLEED = 100;
const SCALE = 1200 / 760;

const bloomedMark = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${(760 + BLEED * 2) * SCALE}" height="${(399 + BLEED * 2) * SCALE}" viewBox="${-BLEED} ${-BLEED} ${760 + BLEED * 2} ${399 + BLEED * 2}">
    <defs>
      <filter id="bloom" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1600" height="1300" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="7" result="warp"/>
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G" result="warped"/>
        <feGaussianBlur in="warped" stdDeviation="4" result="tight"/>
        <feGaussianBlur in="warped" stdDeviation="15" result="loose"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="2" seed="58" result="weightNoise"/>
        <feColorMatrix in="weightNoise" type="matrix" values="3.5 0 0 0 -1.23  3.5 0 0 0 -1.23  3.5 0 0 0 -1.23  0 0 0 0 1" result="weight"/>
        <feComponentTransfer in="weight" result="weightInverse">
          <feFuncR type="table" tableValues="1 0"/><feFuncG type="table" tableValues="1 0"/><feFuncB type="table" tableValues="1 0"/>
        </feComponentTransfer>
        <feComposite in="loose" in2="weight" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="looseShare"/>
        <feComposite in="tight" in2="weightInverse" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="tightShare"/>
        <feComposite in="looseShare" in2="tightShare" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="field"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="3" result="grainNoise"/>
        <feColorMatrix in="grainNoise" type="matrix" values="1 1 1 0 -1 1 1 1 0 -1 1 1 1 0 -1 0 0 0 0 1" result="grain"/>
        <feComposite in="field" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0.18" k4="-0.09" result="grained"/>
        <feComponentTransfer in="grained">
          <feFuncR type="table" tableValues="0.949 0.949 0.949 0.106 0.106 0.21 1 1 0.5 0.047 0.047 0.047"/>
          <feFuncG type="table" tableValues="0.949 0.949 0.949 0.247 0.247 0.76 0.60 0.35 0.1 0.051 0.051 0.051"/>
          <feFuncB type="table" tableValues="0.937 0.937 0.937 0.84 0.84 0.85 0.12 0.31 0.14 0.071 0.071 0.071"/>
        </feComponentTransfer>
      </filter>
    </defs>
    <g filter="url(#bloom)">
      <rect x="-300" y="-300" width="1600" height="1300" fill="#fff"/>
      <g transform="translate(410,22) scale(7)" fill="#000">
        ${MARK_PATHS.map((d) => `<path d="${d}"/>`).join("")}
      </g>
    </g>
  </svg>
`;

const bloomedMarkDataUrl = `data:image/svg+xml,${encodeURIComponent(bloomedMark)}`;

// 字体文件放在仓库里（OFL 许可）：ImageResponse 只认 ttf / otf / woff，next/font 下载的 woff2 用不了。
// Fraunces 取的是 opsz 144 的静态实例，和网站大标题同一种笔画对比。
const fontFile = (name: string) => readFile(join(process.cwd(), "src/assets/fonts", name));

// 带 [locale] 的图片路由在构建时为两种语言分别预生成，避免首次分享时等待渲染。
// 图上只有名字和身份，两种语言是同一张。
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function OpenGraphImage() {
  const [fraunces, geistMono] = await Promise.all([
    fontFile("Fraunces-Display-Regular.ttf"),
    fontFile("GeistMono-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "#0C0D12",
          color: "#F2F2EF",
        }}
      >
        <img
          src={bloomedMarkDataUrl}
          alt=""
          width={(760 + BLEED * 2) * SCALE}
          height={(399 + BLEED * 2) * SCALE}
          style={{ position: "absolute", left: -BLEED * SCALE, top: -BLEED * SCALE }}
        />

        <div
          style={{
            position: "absolute",
            left: 64,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
          }}
        >
          <span
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 104,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_AUTHOR}
          </span>
          <span
            style={{
              display: "flex",
              fontFamily: "Geist Mono",
              fontSize: 19,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#9A9CA6",
            }}
          >
            {SITE_ROLE}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "normal" },
        { name: "Geist Mono", data: geistMono, weight: 400, style: "normal" },
      ],
    },
  );
}
