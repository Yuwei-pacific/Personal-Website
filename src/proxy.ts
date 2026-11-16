import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { LOCALE_COOKIE, isLocale, preferredLocale } from "@/i18n/config";

/** 仅供 404 文档读取的 locale 传递头，见下方 proxy() 内的说明。 */
export const SITE_LOCALE_HEADER = "x-site-locale";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = pathname.split("/")[1];

  if (!isLocale(pathLocale)) {
    // 不带语言前缀的地址：语言跟着访客走。先看他有没有在菜单里手动选过（cookie），
    // 没有就按浏览器语言 —— 意大利语去 /it，其余去 /en。
    // 之前一律跳到意大利语：英语的客户和招聘方点进来，第一眼看到的是意大利语。
    // 307 而不是 308：目的地因人而异，308 会被浏览器和 CDN 当成永久结论缓存下来；Vary 同理
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(chosen) ? chosen : preferredLocale(request.headers.get("accept-language"));
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.redirect(redirectUrl, 307);
    response.headers.set("Vary", "Accept-Language, Cookie");
    return response;
  }

  // 语言从路由段本身读（见 src/app/(site)/[locale]/layout.tsx），不再往下游传 header：
  // 之前 root layout 靠 headers() 拿 locale，而那会把整棵路由树变成 dynamic。
  //
  // 唯一的例外是 404 文档（src/app/global-not-found.tsx）：它绕过了所有 layout，
  // 拿不到 params，而 usePathname() 在那里于构建期为空 —— 结果是整份 404 被静态
  // 生成一次，所有语言共用（/en 的 404 会显示意大利语）。所以这里单独给它传一个
  // 请求头。只有读这个头的路由会变 dynamic，也就是 404 文档自己；站点页面仍从
  // params 读 locale，保持静态。
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SITE_LOCALE_HEADER, pathLocale);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|studio|_next|apple-icon|.*\\..*).*)"],
};
