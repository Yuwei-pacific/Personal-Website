import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ProjectDetailView } from "@/components/projects/project-detail-view";
import { ProjectScrollReset } from "@/components/projects/project-scroll-reset";
import { JsonLd } from "@/components/seo/json-ld";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  buildProjectJsonLd,
  buildProjectMetadata,
  fetchProject,
  fetchProjectSlugs,
} from "./project-data";

// 内容发布由 webhook 即时失效缓存（见 sanity/fetch.ts）；这里是页面级时间兜底。
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await fetchProjectSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};

  const project = await fetchProject(slug, rawLocale);
  if (!project) {
    return { title: getDictionary(rawLocale).metadata.projectNotFound };
  }

  return buildProjectMetadata(project, rawLocale);
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();

  const dictionary = getDictionary(rawLocale);
  const project = await fetchProject(slug, rawLocale);

  if (!project) notFound();

  return (
    <>
      <JsonLd data={buildProjectJsonLd(project, rawLocale)} />
      <ProjectScrollReset />
      <Navbar locale={rawLocale} dictionary={dictionary} />
      <ProjectDetailView
        project={project}
        locale={rawLocale}
        dictionary={dictionary}
      />
      <Footer locale={rawLocale} dictionary={dictionary} />
    </>
  );
}
