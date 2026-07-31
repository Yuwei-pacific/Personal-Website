// 本地化首页：静态界面文案来自字典，项目内容由 Sanity 按 locale 投影。
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutPreview } from "@/components/sections/home/about-preview";
import { Hero } from "@/components/sections/home/hero";
import { ProjectsSection } from "@/components/sections/home/projects-section";
import { JsonLd, personSchema } from "@/components/seo/json-ld";
import { sanityFetch } from "@/sanity/live";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  SITE_TITLE,
  getSiteMetadata,
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";
import { normalizeHomeData } from "@/lib/view-models/home";
import { PROJECTS_QUERY } from "@/sanity/queries";
import type { PROJECTS_QUERY_RESULT } from "@/sanity/sanity.types";

// Sanity Live updates published content immediately; ISR remains a fallback.
export const revalidate = 60;

// 页面元数据：设置首页标题与描述（用于 SEO）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};

  const dictionary = getDictionary(rawLocale);
  const siteMetadata = getSiteMetadata(rawLocale);

  return {
    title: { absolute: SITE_TITLE },
    description: dictionary.metadata.siteDescription,
    alternates: {
      canonical: localizedAbsoluteUrl(rawLocale),
      languages: languageAlternates(),
    },
    openGraph: {
      locale: siteMetadata.openGraphLocale,
      alternateLocale: [siteMetadata.alternateOpenGraphLocale],
      url: localizedAbsoluteUrl(rawLocale),
      title: SITE_TITLE,
      description: dictionary.metadata.siteDescription,
    },
    twitter: {
      title: SITE_TITLE,
      description: dictionary.metadata.siteDescription,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const dictionary = getDictionary(rawLocale);
  // 过滤与排序都在 GROQ 里完成（见 sanity/queries.ts），这里只兜底请求失败
  let projects: PROJECTS_QUERY_RESULT = [];

  try {
    const projectsResult = await sanityFetch({
      query: PROJECTS_QUERY,
      params: { locale: rawLocale },
      perspective: "published",
      stega: false,
    });
    projects = projectsResult.data;
  } catch (error) {
    console.error("Failed to fetch data from Sanity", error);
  }

  const homeData = normalizeHomeData({ projects });

  return (
    // 页面结构：导航栏 + Hero + About 预览 + Projects 列表 + 页脚
    <div className="min-h-screen">
      {/* Person 结构化数据：增强 E-E-A-T 信号 */}
      <JsonLd data={personSchema(rawLocale)} />
      {/* 顶部导航，位于 main 之外（landmark 语义 + skip link 才有意义） */}
      <Navbar locale={rawLocale} dictionary={dictionary} />
      <main id="main-content">
        {/* 首页主视觉区 */}
        <Hero dictionary={dictionary} />
        {/* 关于我预览：完整履历与能力信息位于 /about */}
        <AboutPreview locale={rawLocale} dictionary={dictionary} />

        {/* 项目集合：从 CMS 获取的数据传入 */}
        <ProjectsSection
          projects={homeData.projects}
          locale={rawLocale}
          dictionary={dictionary}
        />
      </main>
      <Footer locale={rawLocale} dictionary={dictionary} />
    </div>
  );
}
