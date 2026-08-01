// 社交分享图（Open Graph）：按首页当前的编辑式排版与点阵棱镜主视觉生成 1200×630 PNG。
import { ImageResponse } from "next/og";

import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SITE_DOMAIN, SITE_TITLE } from "@/lib/site-metadata";

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse 不会运行首页的交互 canvas，因此用 SVG 点阵静态重构同一套视觉：
// 中性点阵作为底图，右侧六束颜色取自 hero_mg.svg 的棱镜色板。
const heroArtwork = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <pattern id="neutral" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.65" fill="#dfe5eb"/>
      </pattern>
      <pattern id="ink" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.8" fill="#171717"/>
      </pattern>
      <pattern id="violet" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.85" fill="#ac9bcc"/>
      </pattern>
      <pattern id="cyan" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.85" fill="#bff0fc"/>
      </pattern>
      <pattern id="lime" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.85" fill="#b1c72f"/>
      </pattern>
      <pattern id="yellow" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.85" fill="#fdfe33"/>
      </pattern>
      <pattern id="orange" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.85" fill="#eba82d"/>
      </pattern>
      <pattern id="red" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2.3" cy="2.3" r="1.85" fill="#d4613c"/>
      </pattern>
      <radialGradient id="text-wash" cx="0" cy="0" r="1" gradientTransform="translate(315 310) rotate(90) scale(280 440)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff" stop-opacity=".97"/>
        <stop offset=".58" stop-color="#fff" stop-opacity=".82"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="1200" height="630" fill="#fff"/>
    <rect width="1200" height="510" fill="url(#neutral)"/>

    <path d="M1200 34V122L610 341L583 347Z" fill="url(#violet)"/>
    <path d="M1200 112V205L610 363L583 357Z" fill="url(#cyan)"/>
    <path d="M1200 194V287L610 383L583 369Z" fill="url(#lime)"/>
    <path d="M1200 274V366L610 403L583 380Z" fill="url(#yellow)"/>
    <path d="M1200 354V447L610 423L583 392Z" fill="url(#orange)"/>
    <path d="M1200 434V510H754L610 442L583 403Z" fill="url(#red)"/>

    <path d="M598 331L682 510H548Z" fill="url(#ink)" opacity=".78"/>
    <path d="M584 344L520 510H596L610 365Z" fill="url(#ink)" opacity=".56"/>
    <ellipse cx="315" cy="310" rx="440" ry="280" fill="url(#text-wash)"/>
  </svg>
`;

const heroArtworkDataUrl = `data:image/svg+xml,${encodeURIComponent(heroArtwork)}`;

const logoArtwork = `
  <svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 55 55">
    <circle cx="27.5" cy="27.5" r="27.5" fill="#000"/>
    <path d="M27.615 10.477h-3.223c-.758 0-1.435.473-1.695 1.185l-.9 2.464c-.43 1.177.441 2.423 1.695 2.423h3.227c.758 0 1.436-.474 1.695-1.187l.897-2.464c.428-1.176-.443-2.421-1.696-2.421Z" fill="#fff"/>
    <path d="M37.462 38.214H24.263c-.758 0-1.436.474-1.695 1.187L21.4 42.609c-.428 1.177.443 2.421 1.695 2.421h13.2c.757 0 1.435-.474 1.694-1.187l1.168-3.208c.428-1.177-.443-2.421-1.695-2.421Z" fill="#fff"/>
    <path d="M24.412 19.276h-3.234c-.758 0-1.435.474-1.695 1.186l-8.088 22.146c-.43 1.176.441 2.423 1.694 2.423h3.263c.758 0 1.436-.474 1.695-1.187l8.061-22.146c.428-1.177-.443-2.421-1.696-2.421Z" fill="#fff"/>
    <path d="m30.805 16.768-5.932 16.297c-.428 1.176.443 2.421 1.695 2.421h11.884c1.253 0 2.124-1.246 1.695-2.423l-5.953-16.297c-.577-1.581-2.813-1.58-3.389.002Z" fill="#fff"/>
  </svg>
`;

const logoArtworkDataUrl = `data:image/svg+xml,${encodeURIComponent(logoArtwork)}`;

// 带 [locale] 的图片路由在构建时为两种语言分别预生成，避免首次分享时等待渲染。
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dictionary = getDictionary(locale);
  const locationLabel = locale === "it" ? "MILANO · IT" : "MILAN · EN";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          background: "#ffffff",
          color: "#171717",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={heroArtworkDataUrl}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />

        <div
          style={{
            position: "absolute",
            left: 52,
            top: 38,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <img src={logoArtworkDataUrl} alt="" width={46} height={46} />
          <span
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.18em",
            }}
          >
            YUWEI LI
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            right: 52,
            top: 52,
            display: "flex",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.16em",
          }}
        >
          {locationLabel}
        </div>

        <div
          style={{
            position: "absolute",
            left: 56,
            top: 150,
            display: "flex",
            flexDirection: "column",
            letterSpacing: "-0.04em",
          }}
        >
          <span style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 0.94 }}>
            Communication
          </span>
          <span style={{ display: "flex", fontSize: 116, fontWeight: 700, lineHeight: 0.92 }}>
            Designer &amp;
          </span>
          <span style={{ display: "flex", fontSize: 66, fontWeight: 700, lineHeight: 1 }}>
            Frontend Developer
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 54px",
            borderTop: "1px solid #d4d4d4",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span
              style={{
                display: "flex",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.17em",
                textTransform: "uppercase",
              }}
            >
              {dictionary.home.hero.basedIn}
            </span>
            <span style={{ display: "flex", fontSize: 24, letterSpacing: "-0.025em" }}>
              {locale === "it"
                ? "Identità visive · Interfacce digitali · Siti web su misura"
                : "Visual identities · Digital interfaces · Custom websites"}
            </span>
          </div>
          <span style={{ display: "flex", fontSize: 20, fontWeight: 700 }}>
            {SITE_DOMAIN}
          </span>
        </div>
      </div>
    ),
    size
  );
}
