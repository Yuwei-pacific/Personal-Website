// 站点的三种字体，由 next/font 自托管（不需要改 CSP）。
// 单独成文件是因为有两份文档要用：公开站点的 root layout（(site)/[locale]/layout.tsx）和
// 绕过所有 layout 的 global-not-found.tsx —— 后者之前没挂这些变量，404 页整页落到浏览器默认的衬线体。
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

// 无衬线（Geist Sans）：正文、界面、小标题。只用 Regular
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// 等宽（Geist Mono）：编号、标签、数据
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 展示字体（Fraunces）：只用于大标题。可变字重 + 斜体（斜体只给一句话里落重音的那个词）；
// opsz 轴让大字号自动用更细的笔画对比
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

/** 挂到 <body> 上的三个 CSS 变量类名 */
export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`;
