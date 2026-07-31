// 公开站点的 root layout（<html>/<body> 在这里，不在 src/app/layout.tsx）。
//
// 为什么把 root layout 下沉到 [locale]：<html lang> 必须随语言变化，而 root layout
// 拿不到子段的 params。之前的做法是在 src/app/layout.tsx 里读 headers() 里的
// x-site-locale —— 但 headers() 是 dynamic API，在 root layout 调用会把整棵路由树
// 拉成 dynamic，页面上的 `export const revalidate` 全部失效，每个请求都要重新 SSR。
// 把 root layout 放到 [locale] 之下后，locale 直接来自 params，静态化与 ISR 恢复。
// /studio 不在这个语言路由里，由 src/app/(studio)/layout.tsx 提供自己的 <html>。
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AppViewTransitions } from "@/components/providers/view-transitions-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { OverscrollBackground } from "@/components/ui/overscroll-background";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  SITE_NAME,
  SITE_URL,
  getSiteMetadata,
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";
import { SanityLive } from "@/sanity/live";
import "lenis/dist/lenis.css";
import "../../globals.css";

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

// 浏览器主题色：与页面统一白背景一致（--color-bg-light = 0 0% 100%；移动端地址栏/状态栏着色）
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};

  const metadata = getSiteMetadata(rawLocale);

  return {
    metadataBase: new URL(SITE_URL),
    authors: [{ name: "Yuwei Li" }],
    creator: "Yuwei Li",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      // Apple touch icon 由 app/apple-icon.tsx 自动生成（180x180 PNG）
    },
    title: {
      default: metadata.title,
      template: `%s | ${SITE_NAME}`,
    },
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: localizedAbsoluteUrl(rawLocale),
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      locale: metadata.openGraphLocale,
      alternateLocale: [metadata.alternateOpenGraphLocale],
      url: localizedAbsoluteUrl(rawLocale),
      title: metadata.title,
      description: metadata.description,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      creator: "@yuweili",
    },
  };
}

export default async function SiteLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const dictionary = getDictionary(rawLocale);

  return (
    <html lang={rawLocale}>
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" />
      </head>
      <body
        // 将两种字体的 CSS 变量应用到 body，并设置全局基础样式
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <AppViewTransitions>
          <LenisProvider>
            <a
              href="#main-content"
              className="sr-only fixed left-4 top-4 z-skip-link bg-design-light-bg px-4 py-2 text-small font-semibold text-design-light-text-primary shadow-card focus:not-sr-only"
            >
              {dictionary.common.skipToMain}
            </a>
            <OverscrollBackground />
            <CustomCursor />
            {/* 显式给内容区加上背景色，这样 body 背景色变化时只会在过界回弹时露出来，而不会影响页面本身。
                这里只是布局容器：landmark 与 #main-content 锚点由各页面自己的 <main> 承担，
                这样导航才落在 main 之外。 */}
            <div className="bg-background min-h-screen w-full relative z-0">
              {children}
            </div>
          </LenisProvider>
        </AppViewTransitions>
        {/* Published Sanity changes invalidate affected query caches and refresh open pages. */}
        <SanityLive includeDrafts={false} />
        {/* Vercel Analytics 组件：用于监测页面性能与用户行为 */}
        {process.env.NODE_ENV === "production" && <Analytics />}
        {/* Vercel Speed Insights 组件：用于性能分析 */}
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
      </body>
    </html>
  );
}
