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
 * next-sanity 13 registers Live sync tags with an infinite Data Cache entry.
 * A page-level `revalidate = 60` cannot refresh that inner entry when a Live
 * event was missed, so the page may keep deleted or hidden documents forever.
 *
 * This keeps the same Sanity sync tags (therefore preserving immediate
 * `<SanityLive />` invalidation) while giving the data entry its own 60-second
 * time fallback. The first, uncached request only obtains sync tags and does
 * not count against the Content Lake API quota.
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
