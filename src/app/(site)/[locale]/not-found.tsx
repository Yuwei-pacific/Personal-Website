// 段级 404：页面里调用 notFound() 时使用（本项目只有 projects/[slug] 这一条路径）。
//
// 两个硬约束都是实测出来的，改动前请先确认它们还成立：
//
// 1. 必须是服务端组件，且不能用客户端 hook。Next 渲染 404 时走的是脱离 root layout
//    的独立文档（响应里的 <html id="__next_error__"> 就是标记），那里没有
//    [locale]/layout.tsx 提供的 Lenis / next-view-transitions provider。
//    写成 "use client" + usePathname() 会渲染出完全空白的页面 —— 这正是它此前
//    从未生效的原因（此前实际显示的是 Next 内置的英文默认页）。
//
// 2. 不能读请求头。加上 await headers() 同样会渲染出空白；单独用 async 则没问题，
//    所以问题出在动态 API 本身，不是异步。因此这里也拿不到 proxy 下发的 locale 头。
//
// 结论：这里只能用 defaultLocale。影响面仅限于「访问一个不存在的项目 slug」——
// 该响应带 404 状态与 noindex，SEO 影响为零，代价是 /en 访客看到意大利语。
// 未命中的 URL 不受影响：那条走 global-not-found.tsx，它能读请求头，语言是正确的。
import { NotFoundView } from "@/components/layout/not-found-view";
import { defaultLocale } from "@/i18n/config";

export default function NotFound() {
  return <NotFoundView locale={defaultLocale} />;
}
