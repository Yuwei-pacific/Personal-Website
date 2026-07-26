import "server-only";

import { defineLive } from "next-sanity/live";

import { sanityClient, sanityToken } from "./client";

export const { sanityFetch, SanityLive } = defineLive({
  client: sanityClient,
  serverToken: sanityToken,
  strict: true,
});
