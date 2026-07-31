import type { NextConfig } from "next";

// dev 模式的 HMR / React Refresh 依赖 eval，生产环境不放开
const isDev = process.env.NODE_ENV === "development";

// 站点内容安全策略。
// 说明几个必须放行的来源，改动前先确认不是它们：
// - 'unsafe-inline' (script)：Next.js 的启动脚本与 flight 数据、以及 JSON-LD 都是内联的。
//   要彻底去掉需要走 middleware 下发 nonce，属于后续独立改造。
// - api.sanity.io：<SanityLive /> 在浏览器里用 EventSource 订阅内容更新，不放行会静默失效。
// - cdn.sanity.io：项目封面 / 画廊图与视频（GIF 与 unoptimized 图片直连 CDN，不过 /_next/image）。
// - vercel：Analytics 与 Speed Insights 的脚本与上报端点。
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io",
  "media-src 'self' blob: https://cdn.sanity.io",
  "font-src 'self' data:",
  "connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://*.apicdn.sanity.io https://cdn.sanity.io https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  // 'self'：留出同源 /studio 里 Presentation 预览本站的可能，同时挡掉跨站点击劫持
  "frame-ancestors 'self'",
  "frame-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // 全站通用、且不会影响 Studio 的响应头
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        // CSP 只作用于站点自身：内嵌的 Sanity Studio 是一个完整的第三方应用
        // （worker、blob、eval、多个 Sanity 域），给它套同一份策略只会不断被迫放宽，
        // 最终连累前台页面。Studio 位于 /studio 且已在 robots.ts 中禁止收录。
        source: "/:path((?!studio).*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
