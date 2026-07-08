// 社交分享图（Open Graph）：构建时生成 1200x630 PNG，
// 替代 webp 头像 —— 部分平台（LinkedIn / WhatsApp / 微信）不支持 webp 作为分享图
import { ImageResponse } from "next/og";

export const alt = "Yuwei Design | UX/UI Designer & Creative Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          // Satori 环境拿不到 CSS 变量，硬编码站点 token 值：
          // 背景 = --color-bg-light（统一白）、文字 = --color-text-primary-light
          background: "#ffffff",
          color: "#171717",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#424242",
          }}
        >
          Portfolio
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 96,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Yuwei Li
        </div>
        <div style={{ marginTop: 20, fontSize: 40, color: "#424242" }}>
          UX/UI Designer &amp; Creative Developer
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#737373",
          }}
        >
          <span>www.yuweidesign.com</span>
          <span>Based in Milan</span>
        </div>
      </div>
    ),
    size
  );
}
