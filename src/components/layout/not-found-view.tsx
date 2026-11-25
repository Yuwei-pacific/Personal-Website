// 404 的可见内容，被两条独立的路径共用：
//   1. src/app/global-not-found.tsx  —— 未命中的 URL（自带 <html>/<body>）
//   2. src/app/(site)/[locale]/not-found.tsx —— 页面里 notFound() 抛出的情况
//
// 为什么是服务端组件、且不渲染 Navbar/Footer：
// Next 渲染 404 时走的是脱离 root layout 的独立文档（响应里的
// <html id="__next_error__"> 就是标记）。那里既没有 [locale]/layout.tsx 的
// Lenis / next-view-transitions provider，客户端组件也渲染不出内容 ——
// 实测把边界写成 "use client" + usePathname() 会得到一个完全空白的页面。
// 所以这里只用服务端能渲染的东西：纯标记 + 一个原生 <a>。
import type { Locale } from "@/i18n/config";
import { StressedText } from "@/components/ui/stress";
import { textLink } from "@/components/ui/text-link";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

export function NotFoundView({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <main
      id="main-content"
      // 和其他页面一样贴页边、靠左，不居中收窄
      className="flex min-h-screen w-full flex-col items-start justify-center gap-4 px-edge sm:px-edge-sm"
    >
      <p className="font-mono text-label uppercase text-design-light-text-muted">
        404
      </p>
      <h1 className="text-balance font-display text-display-sm tracking-display text-design-light-text-primary sm:text-display">
        <StressedText text={dictionary.errors.notFoundTitle} word={dictionary.errors.notFoundStress} variant={1} />
      </h1>
      <p className="max-w-xl text-body text-design-light-text-secondary">
        {dictionary.errors.notFoundBody}
      </p>
      {/* 原生 <a>：整页加载，但在没有 provider 的文档里一定可用 */}
      <a
        href={localizedPath(locale)}
        className={textLink("lg", "mt-4")}
      >
        {dictionary.errors.backHome}
      </a>
    </main>
  );
}
