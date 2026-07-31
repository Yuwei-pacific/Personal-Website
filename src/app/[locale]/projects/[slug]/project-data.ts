import { cache } from "react";
import type { Metadata } from "next";

import { sanityClient } from "@/sanity/client";
import { sanityFetch } from "@/sanity/live";
import { normalizeProjectDetail } from "@/lib/view-models/project";
import { PROJECT_QUERY, PROJECT_SLUGS_QUERY } from "@/sanity/queries";
import type { PROJECT_QUERY_RESULT } from "@/sanity/sanity.types";
import type { ProjectDetail } from "@/lib/view-models/types";
import type { Locale } from "@/i18n/config";
import {
  SITE_AUTHOR,
  getSiteMetadata,
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";

export const fetchProject = cache(async (
  rawSlug: string | undefined,
  locale: Locale,
): Promise<ProjectDetail | null> => {
  const slug = rawSlug?.toString().trim();
  if (!slug) return null;

  try {
    const { data: result }: { data: PROJECT_QUERY_RESULT } = await sanityFetch({
      query: PROJECT_QUERY,
      params: { slug, locale },
      perspective: "published",
      stega: false,
    });
    return normalizeProjectDetail(result, slug);
  } catch (error) {
    console.error("Failed to fetch project from Sanity", error);
    return null;
  }
});

export async function fetchProjectSlugs() {
  try {
    const slugs = await sanityClient.fetch(PROJECT_SLUGS_QUERY);
    return slugs.filter((slug): slug is string => Boolean(slug));
  } catch {
    return [];
  }
}

const projectPath = (project: ProjectDetail) => `/projects/${project.slug}`;

export function buildProjectMetadata(project: ProjectDetail, locale: Locale): Metadata {
  const projectTitle = project.title || "Project";
  const url = localizedAbsoluteUrl(locale, projectPath(project));
  const siteMetadata = getSiteMetadata(locale);

  return {
    title: { absolute: `${projectTitle} | ${SITE_AUTHOR}` },
    description: project.summary || undefined,
    alternates: {
      canonical: url,
      languages: languageAlternates(projectPath(project)),
    },
    openGraph: {
      type: "article",
      locale: siteMetadata.openGraphLocale,
      alternateLocale: [siteMetadata.alternateOpenGraphLocale],
      url,
      title: `${projectTitle} | ${SITE_AUTHOR}`,
      description: project.summary || undefined,
      images: project.coverImage
        ? [
            {
              url: `${project.coverImage.url}?w=1200&h=630&fit=crop&auto=format`,
              width: 1200,
              height: 630,
              alt: projectTitle,
            },
          ]
        : undefined,
    },
  };
}

export function buildProjectJsonLd(project: ProjectDetail, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title || "Project",
    description: project.summary || undefined,
    url: localizedAbsoluteUrl(locale, projectPath(project)),
    inLanguage: locale,
    image: project.coverImage?.url,
    creator: {
      "@type": "Person",
      name: SITE_AUTHOR,
      url: localizedAbsoluteUrl(locale),
    },
    dateCreated: project.year ? String(project.year) : undefined,
    keywords: project.tags.length ? project.tags.join(", ") : undefined,
  };
}
