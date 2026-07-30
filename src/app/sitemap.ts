import type { MetadataRoute } from "next";

import { sanityClient } from "@/sanity/client";
import { PROJECT_SITEMAP_QUERY } from "@/sanity/queries";

const baseUrl = "https://www.yuweidesign.com";
const fallbackLastModified = new Date("2026-01-01");
const sitemapClient = sanityClient.withConfig({ useCdn: false });

// A sitemap has no mounted SanityLive client, so read published content directly
// instead of relying on its long-lived query cache.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const projects = await sitemapClient.fetch(
      PROJECT_SITEMAP_QUERY,
      {},
      { cache: "no-store" },
    );
    const validProjects = projects.filter(
      (project): project is { slug: string; _updatedAt: string } =>
        Boolean(project.slug),
    );
    const latestProjectDate = validProjects.reduce((latest, project) => {
      const updatedAt = new Date(project._updatedAt);
      return updatedAt > latest ? updatedAt : latest;
    }, fallbackLastModified);

    const routes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: latestProjectDate,
        changeFrequency: "monthly",
        priority: 1,
      },
      {
        url: `${baseUrl}/about`,
        changeFrequency: "monthly",
        priority: 0.7,
      },
    ];

    routes.push(
      ...validProjects.map((project) => ({
        url: `${baseUrl}/projects/${project.slug}`,
        lastModified: new Date(project._updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    );

    return routes;
  } catch (error) {
    console.error("Failed to fetch projects for sitemap", error);
  }

  return [
    {
      url: baseUrl,
      lastModified: fallbackLastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
