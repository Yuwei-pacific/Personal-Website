// Sanity 发布 webhook → 失效所有 Sanity 取数缓存（见 src/sanity/fetch.ts）。
//
// 在 sanity.io/manage → API → Webhooks 中配置：
// - URL：https://www.yuweidesign.com/api/revalidate，方法 POST
// - Dataset：personal_website；Trigger on：Create / Update / Delete
// - Filter 留空（任何已发布文档变化都整体失效）；Drafts 不勾选
// - Secret：与部署环境变量 SANITY_REVALIDATE_SECRET 相同
// 未配置时站点仍靠 60 秒时间兜底更新，只是不再即时。
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

import { SANITY_CACHE_TAG } from "@/sanity/fetch";

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { message: "SANITY_REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  // parseBody 会校验签名，并等待 Content Lake 最终一致后再返回，
  // 这样随后重新生成页面时读到的就是刚发布的内容。
  const { isValidSignature, body } = await parseBody<{ _type?: string }>(
    request,
    secret,
  );

  if (!isValidSignature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  // expire: 0 —— 立即过期，下一次请求直接拿新内容，而不是先看到一次旧页面。
  revalidateTag(SANITY_CACHE_TAG, { expire: 0 });

  return NextResponse.json({ revalidated: true, type: body?._type ?? null });
}
