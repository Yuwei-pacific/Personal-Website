import { cache } from "react";
import type { Metadata } from "next";

import { sanityClient } from "@/lib/sanity";
import { normalizeProjectDetail } from "@/lib/view-models/project";
import { PROJECT_QUERY, PROJECT_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { PROJECT_QUERYResult } from "@/sanity/sanity.types";
import type { ProjectDetail } from "@/types";

const SITE_URL = "https://www.yuweidesign.com";

export const fetchProject = cache(async (rawSlug?: string): Promise<ProjectDetail | null> => {
  const slug = rawSlug?.toString().trim();
  if (!slug) return null;

  try {
    const result: PROJECT_QUERYResult = await sanityClient.fetch(PROJECT_QUERY, { slug });
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

const projectUrl = (project: ProjectDetail) => `${SITE_URL}/projects/${project.slug}`;

export function buildProjectMetadata(project: ProjectDetail): Metadata {
  const projectTitle = project.title || "Project";
  const url = projectUrl(project);

  return {
    title: `${projectTitle} | Yuwei Li`,
    description: project.summary || undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: `${projectTitle} | Yuwei Li`,
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

export function buildProjectJsonLd(project: ProjectDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title || "Project",
    description: project.summary || undefined,
    url: projectUrl(project),
    image: project.coverImage?.url,
    creator: {
      "@type": "Person",
      name: "Yuwei Li",
      url: SITE_URL,
    },
    dateCreated: project.year ? String(project.year) : undefined,
    keywords: project.tags.length ? project.tags.join(", ") : undefined,
  };
}
