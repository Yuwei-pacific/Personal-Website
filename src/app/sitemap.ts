import type { MetadataRoute } from "next";

import { sanityClient } from "@/sanity/client";
import { PROJECT_SITEMAP_QUERY } from "@/sanity/queries";
import { locales } from "@/i18n/config";
import {
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";

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

    const routes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
      {
        url: localizedAbsoluteUrl(locale),
        lastModified: latestProjectDate,
        changeFrequency: "monthly" as const,
        priority: 1,
        alternates: { languages: languageAlternates() },
      },
      {
        url: localizedAbsoluteUrl(locale, "/about"),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages: languageAlternates("/about") },
      },
    ]);

    routes.push(
      ...validProjects.flatMap((project) => {
        const path = `/projects/${project.slug}`;
        return locales.map((locale) => ({
          url: localizedAbsoluteUrl(locale, path),
          lastModified: new Date(project._updatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.8,
          alternates: { languages: languageAlternates(path) },
        }));
      }),
    );

    return routes;
  } catch (error) {
    console.error("Failed to fetch projects for sitemap", error);
  }

  return locales.flatMap((locale) => [
    {
      url: localizedAbsoluteUrl(locale),
      lastModified: fallbackLastModified,
      changeFrequency: "monthly" as const,
      priority: 1,
      alternates: { languages: languageAlternates() },
    },
    {
      url: localizedAbsoluteUrl(locale, "/about"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: languageAlternates("/about") },
    },
  ]);
}
