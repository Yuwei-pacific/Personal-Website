import type { MetadataRoute } from "next";

import { sanityClient } from "@/sanity/client";
import { PROJECT_SITEMAP_QUERY } from "@/sanity/queries";
import { SITE_URL, absoluteUrl } from "@/lib/site-metadata";

const baseUrl = SITE_URL;
const fallbackLastModified = new Date("2026-01-01");
const sitemapClient = sanityClient.withConfig({ useCdn: false });

// sitemap 没有挂载 SanityLive，拿不到它的缓存失效信号，所以自己读已发布内容。
// 但也不必每次抓取都打一次 Content Lake：项目更新频率远低于爬虫抓取频率，
// 用 1 小时的时间兜底即可（内容有变最迟 1 小时后进入 sitemap）。
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const projects = await sitemapClient.fetch(
      PROJECT_SITEMAP_QUERY,
      {},
      { next: { revalidate } },
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
        url: absoluteUrl("/about"),
        changeFrequency: "monthly",
        priority: 0.7,
      },
    ];

    routes.push(
      ...validProjects.map((project) => ({
        url: absoluteUrl(`/projects/${project.slug}`),
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
      url: absoluteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
