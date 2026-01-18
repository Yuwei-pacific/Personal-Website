// 全局布局：配置字体、默认元数据与基础样式
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

// 配置无衬线字体（Geist Sans）：
// - variable：注入到 CSS 自定义属性，便于全局使用
// - subsets：指定子集以优化打包体积
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// 配置等宽字体（Geist Mono）：用于代码或数字对齐的场景
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 页面默认元数据：用于 SEO 与浏览器/系统图标
export const metadata: Metadata = {
  title: "About Me | Yuwei Li",
  description: "Portfolio and background of Yuwei Li.",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

// 应用根布局：定义 <html> 与全局 <body> 样式
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // 将两种字体的 CSS 变量应用到 body，并设置全局基础样式
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        {/* 页面内容插槽：各路由页面将被渲染到此 */}
        {children}
        {/* Vercel Analytics 组件：用于监测页面性能与用户行为 */}
        <Analytics />
        {/* Vercel Speed Insights 组件：用于性能分析 */}
        <SpeedInsights />
      </body>
    </html>
  );
}
