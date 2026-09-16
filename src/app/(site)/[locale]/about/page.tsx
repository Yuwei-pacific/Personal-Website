import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { AboutPageContent } from "@/components/sections/about/about-page-content";
import { Footer } from "@/components/layout/footer";
import { JsonLd, personSchema } from "@/components/seo/json-ld";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  SITE_NAME,
  SITE_TWITTER_HANDLE,
  getSiteMetadata,
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";
import { normalizeAboutData } from "@/lib/view-models/home";
import { sanityFetch } from "@/sanity/live";
import { RESUME_QUERY, SKILLS_QUERY } from "@/sanity/queries";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};

  const dictionary = getDictionary(rawLocale);
  const siteMetadata = getSiteMetadata(rawLocale);
  const path = "/about";

  return {
    title: dictionary.metadata.aboutTitle,
    description: dictionary.metadata.aboutDescription,
    alternates: {
      canonical: localizedAbsoluteUrl(rawLocale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "website",
      locale: siteMetadata.openGraphLocale,
      alternateLocale: [siteMetadata.alternateOpenGraphLocale],
      url: localizedAbsoluteUrl(rawLocale, path),
      title: dictionary.metadata.aboutTitle,
      description: dictionary.metadata.aboutDescription,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.metadata.aboutTitle,
      description: dictionary.metadata.aboutDescription,
      creator: SITE_TWITTER_HANDLE,
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const dictionary = getDictionary(rawLocale);
  // 同首页：不吞异常（见 page.tsx 的说明）。这里两个查询共用一次 await，
  // 任一失败都会让整页走 error.tsx —— 这是刻意的，半空的 /about 比错误页更糟。
  const [skillsResult, resumeResult] = await Promise.all([
    sanityFetch({
      query: SKILLS_QUERY,
      params: { locale: rawLocale },
      perspective: "published",
      stega: false,
    }),
    sanityFetch({
      query: RESUME_QUERY,
      params: { locale: rawLocale },
      perspective: "published",
      stega: false,
    }),
  ]);
  const skillCategories = skillsResult.data;
  const resumeItems = resumeResult.data;

  const aboutData = normalizeAboutData({ skillCategories, resumeItems });

  return (
    <>
      <JsonLd data={personSchema(rawLocale)} />
      <Navbar locale={rawLocale} dictionary={dictionary} />
      <AboutPageContent
        skillCategories={aboutData.skillCategories}
        resumeItems={aboutData.resumeItems}
        locale={rawLocale}
        dictionary={dictionary}
      />
      <Footer locale={rawLocale} dictionary={dictionary} />
    </>
  );
}
