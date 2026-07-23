import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { ProjectDetailView } from "@/components/projects/project-detail-view";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildProjectJsonLd,
  buildProjectMetadata,
  fetchProject,
  fetchProjectSlugs,
} from "./project-data";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await fetchProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) return { title: "Project Not Found | Yuwei Li" };

  return buildProjectMetadata(project);
}

export default async function ProjectPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params;
  const project = await fetchProject(slug);

  if (!project) notFound();

  return (
    <>
      <JsonLd data={buildProjectJsonLd(project)} />
      <Navbar />
      <ProjectDetailView project={project} />
    </>
  );
}
