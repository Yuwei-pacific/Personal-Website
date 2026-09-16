// 全局 404：未命中的 URL（Next 会为它生成独立文档）。
//
// 需要这个文件，是因为本仓库同时满足 Next 文档里 global-not-found 存在的两个前提：
// 有多个 root layout（(site) 与 (studio) 两个 route group），且 root layout 位于
// 顶层动态段之下（[locale]）—— 这种形状下没有单一 layout 可以组装全局 404，
// 未命中的 URL 会一直落到 Next 内置的英文默认页。开关在 next.config.ts 的
// experimental.globalNotFound。
//
// 它绕过了 root layout，所以必须自带 <html>/<body>/<head>。也因此可以正常
// import globals.css（设计 token 可用），这点和 global-error.tsx 不同。
//
// 为什么读请求头而不是 usePathname()：这份文档在构建期会被静态生成一次，
// 那一刻没有 pathname，于是所有语言共用同一份 HTML（/en 的 404 会显示意大利语）。
// 读 headers() 把它变成 dynamic，才能拿到每个请求真实的语言。头由 src/proxy.ts 下发。
import { headers } from "next/headers";

import { NotFoundView } from "@/components/layout/not-found-view";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SITE_LOCALE_HEADER } from "@/proxy";
import "./globals.css";

export default async function GlobalNotFound() {
  const requestHeaders = await headers();
  const segment = requestHeaders.get(SITE_LOCALE_HEADER);
  // proxy.ts 保证首段一定是合法 locale，这里的兜底只防御非路由场景。
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dictionary = getDictionary(locale);

  return (
    <html lang={locale}>
      <head>
        <title>{`404 | ${dictionary.errors.notFoundTitle}`}</title>
        <meta name="robots" content="noindex" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NotFoundView locale={locale} />
      </body>
    </html>
  );
}
