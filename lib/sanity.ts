import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2024-01-01";
const token = process.env.SANITY_READ_TOKEN?.trim() || undefined;

export const sanityClient =
  projectId && dataset
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: !token && process.env.NODE_ENV === "production",
        perspective: "published",
        token,
      })
    : null;

export const isSanityConfigured = () => Boolean(projectId && dataset);
