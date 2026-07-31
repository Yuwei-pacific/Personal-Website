import "server-only";

import type { ClientReturn, ContentSourceMap, QueryParams } from "next-sanity";
import { defineLive } from "next-sanity/live";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

import { sanityClient, sanityToken } from "./client";

const LIVE_CACHE_TAG_PREFIX = "sanity:";
const PUBLISHED_REVALIDATE_SECONDS = 60;

const publishedClient = sanityClient.withConfig({
  allowReconfigure: false,
  perspective: "published",
  stega: false,
  // This module is server-only, so an optional private-dataset token remains
  // confined to server requests and can never enter the browser bundle.
  useCdn: true,
});

export const { SanityLive } = defineLive({
  client: sanityClient,
  serverToken: sanityToken,
  strict: true,
});

type PublishedFetchOptions<QueryString extends string> = {
  query: QueryString;
  params?: QueryParams | Promise<QueryParams>;
  perspective: "published";
  stega: false;
  tags?: string[];
  requestTag?: string;
};

type PublishedFetchResult<QueryString extends string> = {
  data: ClientReturn<QueryString, unknown>;
  sourceMap: ContentSourceMap | null;
  tags: string[];
};

/**
 * Published-only counterpart to `defineLive().sanityFetch()`.
 *
 * 这是官方实现的镜像，只改了一个参数。核对过的版本：next-sanity@13.2.1，
 * `dist/live/conditions/react-server/index.js` —— 官方同样是「先取 syncTags、
 * 再带 tags 取数据」的两段式请求，区别只在于官方数据请求写死
 * `next: { revalidate: false }`（永不按时间过期，完全依赖 Live 事件失效）。
 *
 * 为什么要覆盖：一旦某次 Live 事件丢失（断线、标签未命中），那条 Data Cache
 * 记录就再也不会自己刷新，页面可能长期保留已删除或已隐藏的文档；
 * 页面级的 `export const revalidate = 60` 管不到这条内层 fetch 记录。
 * 这里保留完全相同的 sync tags（因此 `<SanityLive />` 的即时失效照常生效），
 * 只额外给它 60 秒的时间兜底。
 *
 * 退出条件（满足任一即可删除本函数、改回 `defineLive()` 导出的 sanityFetch）：
 *  1. next-sanity 允许调用方配置这条内层 fetch 的 revalidate；
 *  2. 官方默认值不再是 `revalidate: false`。
 * 升级 next-sanity 时请重新核对上面那个文件，确认本镜像是否仍与官方一致。
 */
export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  perspective,
  stega,
  tags = [],
  requestTag = "portfolio.fetch",
}: PublishedFetchOptions<QueryString>): Promise<PublishedFetchResult<QueryString>> {
  const resolvedParams = await params;
  const cacheMode =
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ? undefined : ("noStale" as const);

  const { syncTags } = await publishedClient.fetch(query, resolvedParams, {
    filterResponse: false,
    perspective,
    stega,
    resultSourceMap: false,
    returnQuery: false,
    useCdn: true,
    cacheMode,
    tag: `${requestTag}.fetch-sync-tags`,
  });

  const cacheTags = [
    ...new Set([
      ...tags,
      ...(syncTags?.map((tag) => `${LIVE_CACHE_TAG_PREFIX}${tag}`) ?? []),
    ]),
  ];

  const { result, resultSourceMap } = await publishedClient.fetch(query, resolvedParams, {
    filterResponse: false,
    perspective,
    stega,
    next: {
      revalidate: PUBLISHED_REVALIDATE_SECONDS,
      tags: cacheTags,
    },
    useCdn: true,
    cacheMode,
    tag: requestTag,
  });

  return {
    data: result,
    sourceMap: resultSourceMap ?? null,
    tags: cacheTags,
  };
}
