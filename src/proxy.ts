import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = pathname.split("/")[1];

  if (!isLocale(pathLocale)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  // 语言从路由段本身读（见 src/app/(site)/[locale]/layout.tsx），不再往下游传 header：
  // 之前 root layout 靠 headers() 拿 locale，而那会把整棵路由树变成 dynamic。
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|studio|_next|apple-icon|.*\\..*).*)"],
};
