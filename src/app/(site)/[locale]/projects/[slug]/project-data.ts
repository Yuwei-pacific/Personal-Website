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
  SITE_NAME,
  SITE_TWITTER_HANDLE,
  absoluteUrl,
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

  // 不 try/catch：PROJECT_QUERY 是 `[0]`，文档真的不存在时返回 null，
  // 由 normalizeProjectDetail 归一成 null 再走 404。取数失败则抛出，
  // 交给 error.tsx。把两者都塞成 null 会让一次网络抖动把已有项目变成
  // 真 404 —— 爬虫据此判定删除并掉出索引，而站点其实好着。
  // 显式传入结果类型：PROJECT_QUERY 太长，超出了 TypeScript 模板字面量类型的
  // 替换量预算，导致它无法与 typegen 生成的 SanityQueries key 对上，推断会退化成
  // unknown。这里补上 typegen 的类型，保持端到端有类型（详见 live.ts 的说明）。
  const { data: result } = await sanityFetch<
    typeof PROJECT_QUERY,
    PROJECT_QUERY_RESULT
  >({
    query: PROJECT_QUERY,
    params: { slug, locale },
    perspective: "published",
    stega: false,
  });
  return normalizeProjectDetail(result, slug);
});

export async function fetchProjectSlugs() {
  // 供 generateStaticParams 使用。这里同样不吞异常：返回 [] 会让构建
  // "成功"但一个项目页都不生成，故障被藏进产物里；让构建失败才是响亮的。
  const slugs = await sanityClient.fetch(PROJECT_SLUGS_QUERY);
  return slugs.filter((slug): slug is string => Boolean(slug));
}

const projectPath = (project: ProjectDetail) => `/projects/${project.slug}`;

export function buildProjectMetadata(project: ProjectDetail, locale: Locale): Metadata {
  const projectTitle = project.title || "Project";
  const url = localizedAbsoluteUrl(locale, projectPath(project));
  const siteMetadata = getSiteMetadata(locale);
  const title = `${projectTitle} | ${SITE_AUTHOR}`;
  const images = project.coverImage
    ? [
        {
          url: `${project.coverImage.url}?w=1200&h=630&fit=crop&auto=format`,
          width: 1200,
          height: 630,
          alt: projectTitle,
        },
      ]
    : undefined;

  return {
    title: { absolute: title },
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
      title,
      description: project.summary || undefined,
      siteName: SITE_NAME,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.summary || undefined,
      creator: SITE_TWITTER_HANDLE,
      images,
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
      "@id": absoluteUrl("/#person"),
      name: SITE_AUTHOR,
      url: absoluteUrl(),
    },
    dateCreated: project.year ? String(project.year) : undefined,
    keywords: project.tags.length ? project.tags.join(", ") : undefined,
  };
}
