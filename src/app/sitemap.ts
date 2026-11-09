import type { MetadataRoute } from "next";

import { sanityClient } from "@/sanity/client";
import { SANITY_CACHE_TAG } from "@/sanity/fetch";
import { PROJECT_SITEMAP_QUERY } from "@/sanity/queries";
import { locales } from "@/i18n/config";
import {
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";

const fallbackLastModified = new Date("2026-01-01");
const sitemapClient = sanityClient.withConfig({ useCdn: false });

// sitemap 直连 Content Lake（不走 CDN）读已发布内容，并挂上与页面相同的 cache tag：
// 发布 webhook（src/app/api/revalidate）会让它和页面一起失效。
// 时间兜底放宽到 1 小时 —— 项目更新频率远低于爬虫抓取频率。
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 取数失败刻意不兜底：旧实现在 catch 里回落到「只有首页 + about」的 sitemap，
  // 而本路由 revalidate = 3600 —— 一次抖动会让全部项目 URL 从 sitemap 里消失
  // 整整一小时（且 scripts/smoke.mjs 是拿 sitemap 当项目路由清单的，它会跟着
  // 打印 0 条还照样退出 0，故障完全不可见）。
  // 抛出后由 ISR 语义接管：重新生成失败时继续服务上一次生成好的 sitemap。
  const projects = await sitemapClient.fetch(
    PROJECT_SITEMAP_QUERY,
    {},
    { next: { revalidate, tags: [SANITY_CACHE_TAG] } },
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
}
