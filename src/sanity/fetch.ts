// 站点读取 Sanity 已发布内容的唯一入口（Server Component 专用）。
//
// 缓存与失效：
// - 每条取数都挂同一个 cache tag（SANITY_CACHE_TAG）。Sanity 发布内容时由 webhook
//   打到 src/app/api/revalidate/route.ts，整体失效这个 tag —— 内容量很小，
//   按文档精确失效带来的收益不值得它的复杂度。
// - 另有 60 秒的时间兜底：webhook 没配、丢失或失败时，内容最迟约一分钟后自愈。
//
// 为什么不用 next-sanity 的 <SanityLive />：它会给每位访客的浏览器加载一份
// Sanity 客户端（约 33KB gzip）并常驻一条 EventSource 长连接，只为让「已经开着的
// 页面」实时刷新。作品集的内容更新频率远低于访问频率，这份代价不值得。
import "server-only";

import type { ClientReturn, QueryParams } from "next-sanity";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { sanityClient } from "./client";

/** 所有 Sanity 取数共用的 Next 缓存 tag；/api/revalidate 收到发布事件后失效它。 */
export const SANITY_CACHE_TAG = "sanity";

const REVALIDATE_SECONDS = 60;

const publishedClient = sanityClient.withConfig({
  allowReconfigure: false,
  perspective: "published",
  stega: false,
  // 本模块 server-only，可选的私有数据集 token 只会留在服务端请求里。
  useCdn: true,
});

/**
 * `Result` 默认由查询字面量经 SanityQueries 映射解析出来（typegen 生成）。
 *
 * 之所以允许调用方显式覆盖：TypeScript 对模板字面量类型有替换量预算，
 * PROJECT_QUERY 这种超长查询（内含约 15 处插值）会超出预算而被降级，
 * 字面量与 typegen 生成的 key 不再逐字符相等，映射查不到，data 退化成 unknown。
 * 这种查询在调用处显式传入 typegen 类型即可（见 project-data.ts）。
 */
export async function sanityFetch<
  const QueryString extends string,
  Result = ClientReturn<QueryString, unknown>,
>({
  query,
  params = {},
}: {
  query: QueryString;
  params?: QueryParams;
}): Promise<{ data: Result }> {
  const data = await publishedClient.fetch(query, params, {
    // noStale：让 API CDN 不返回「过期但仍在后台刷新」的旧结果，否则 webhook 触发
    // 重新生成时可能又把旧内容缓存一轮。构建期沿用 next-sanity 官方实现的做法不加。
    cacheMode:
      process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ? undefined : "noStale",
    next: { revalidate: REVALIDATE_SECONDS, tags: [SANITY_CACHE_TAG] },
  });

  return { data: data as Result };
}
