// 公开站点的 root layout（<html>/<body> 在这里，不在 src/app/layout.tsx）。
//
// 为什么把 root layout 下沉到 [locale]：<html lang> 必须随语言变化，而 root layout
// 拿不到子段的 params。之前的做法是在 src/app/layout.tsx 里读 headers() 里的
// x-site-locale —— 但 headers() 是 dynamic API，在 root layout 调用会把整棵路由树
// 拉成 dynamic，页面上的 `export const revalidate` 全部失效，每个请求都要重新 SSR。
// 把 root layout 放到 [locale] 之下后，locale 直接来自 params，静态化与 ISR 恢复。
// /studio 不在这个语言路由里，由 src/app/(studio)/layout.tsx 提供自己的 <html>。
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { InkTransitionOverlay } from "@/components/projects/ink-transition";
import { AppViewTransitions } from "@/components/providers/view-transitions-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { OverscrollBackground } from "@/components/ui/overscroll-background";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  SITE_NAME,
  SITE_TWITTER_HANDLE,
  SITE_URL,
  getSiteMetadata,
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";
import { fontVariables } from "../../fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "lenis/dist/lenis.css";
import "../../globals.css";

// 浏览器主题色：跟随系统深浅，对应纸 / 墨两种底色（移动端地址栏/状态栏着色）。
// 手动切换主题时由 hooks/use-theme.ts 同步更新这两个 meta。
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F3" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0D12" },
  ],
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
    // 不显式写 index/follow：它们本就是默认值，而写出来的 "index, follow" 会被
    // 继承进 notFound() 渲染的 404 文档，和 Next 自动加的 noindex 并存成两条互相
    // 矛盾的 robots 标签。这里只保留真正改变默认行为的 googlebot 预览指令。
    robots: {
      googleBot: {
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
      creator: SITE_TWITTER_HANDLE,
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
    // suppressHydrationWarning：data-theme 由上面的内联脚本在水合前写入，服务端渲染时没有
    <html lang={rawLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://cdn.sanity.io" />
      </head>
      <body
        // 将三种字体的 CSS 变量应用到 body（定义在 app/fonts.ts），并设置全局基础样式
        className={`${fontVariables} min-h-screen bg-background text-foreground antialiased`}
      >
        <AppViewTransitions>
          <LenisProvider>
            <a
              href="#main-content"
              className="skip-link bg-design-light-bg text-small font-semibold text-design-light-text-primary shadow-card"
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
          {/* 进入项目的过场：一滩墨漫开铺满屏幕（见 projects/ink-transition.tsx） */}
          <InkTransitionOverlay />
        </AppViewTransitions>
        {/* Vercel Analytics 组件：用于监测页面性能与用户行为 */}
        {process.env.NODE_ENV === "production" && <Analytics />}
        {/* Vercel Speed Insights 组件：用于性能分析 */}
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
      </body>
    </html>
  );
}
