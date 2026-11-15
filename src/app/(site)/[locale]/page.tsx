// 本地化首页：静态界面文案来自字典，项目内容由 Sanity 按 locale 投影。
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutPreview } from "@/components/sections/home/about-preview";
import { Hero } from "@/components/sections/home/hero";
import { WorkSection } from "@/components/sections/home/work/work-section";
import { JsonLd, personSchema, websiteSchema } from "@/components/seo/json-ld";
import { sanityFetch } from "@/sanity/fetch";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  SITE_NAME,
  SITE_TWITTER_HANDLE,
  getSiteMetadata,
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";
import { normalizeHomeWork } from "@/lib/view-models/home";
import { HOME_WORK_QUERY } from "@/sanity/queries";

// 内容发布由 webhook 即时失效缓存（见 sanity/fetch.ts）；这里是页面级时间兜底。
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
    title: { absolute: siteMetadata.title },
    description: dictionary.metadata.siteDescription,
    alternates: {
      canonical: localizedAbsoluteUrl(rawLocale),
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      locale: siteMetadata.openGraphLocale,
      alternateLocale: [siteMetadata.alternateOpenGraphLocale],
      url: localizedAbsoluteUrl(rawLocale),
      title: siteMetadata.title,
      description: dictionary.metadata.siteDescription,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: siteMetadata.title,
      description: dictionary.metadata.siteDescription,
      creator: SITE_TWITTER_HANDLE,
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
  // 过滤与排序都在 GROQ 里完成（见 sanity/queries.ts）。
  //
  // 这里刻意不 try/catch：吞掉异常会让一次 CDN 抖动渲染成"空项目"页面，
  // 而那是 200 + indexable 的，会被搜索收录并顶掉好页面 —— 空结果和取数失败
  // 必须区分开。抛出后由 error.tsx 接管；若该页已有 ISR 缓存，Next 在重新生成
  // 失败时会继续服务上一次的好版本，冷缓存才落到错误页。
  const { data } = await sanityFetch({
    query: HOME_WORK_QUERY,
    params: { locale: rawLocale },
  });

  const work = normalizeHomeWork(data);

  return (
    // 页面结构：导航栏 + Hero + About 预览 + Projects 列表 + 页脚
    <div className="min-h-screen">
      {/* Person 结构化数据：增强 E-E-A-T 信号 */}
      <JsonLd data={websiteSchema()} />
      <JsonLd data={personSchema(rawLocale)} />
      {/* 顶部导航，位于 main 之外（landmark 语义 + skip link 才有意义） */}
      <Navbar locale={rawLocale} dictionary={dictionary} />
      <main id="main-content">
        {/* 三段正常往下排，同一张纸作底（用户在 Figma 定稿：About 不再用纸 2）。页脚在 main 之外，是每页唯一反转的区块。
            首页不用叠纸（ui/sheet.tsx）：About 的墨线从页面左缘进来、绕过人像，在区块下缘接上 Work 的墨线 ——
            叠纸让每张纸贴住屏幕、下一张滑上来盖住，线在纸边被一刀刀切断，同一屏里还会出现两截对不上的线 */}
        <div className="surface-base bg-background">
          <Hero dictionary={dictionary} />
        </div>
        {/* 关于我预览：完整履历与能力信息位于 /about */}
        <div className="surface-base bg-background">
          <AboutPreview locale={rawLocale} dictionary={dictionary} />
        </div>
        {/* 作品：精选在墨滩里、其余进目录（见 sections/home/work/work-section.tsx） */}
        <div className="surface-base bg-background">
          <WorkSection featured={work.featured} index={work.index} locale={rawLocale} dictionary={dictionary} />
        </div>
      </main>
      <Footer locale={rawLocale} dictionary={dictionary} />
    </div>
  );
}
