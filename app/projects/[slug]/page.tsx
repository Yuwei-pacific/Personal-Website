import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import groq from "groq";

import { Navbar } from "@/components/layout/navbar";
import { ProjectGallery } from "@/components/projects/project-gallery";
import type { Project } from "@/components/sections/projects-section";
import { isSanityConfigured, sanityClient } from "@/lib/sanity";
import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

type Block = PortableTextBlock & {
  children?: Array<{ text?: string }>;
};

type ProjectDetail = Project & {
  role?: string[];
  tags?: string[];
  client?: string;
  location?: string;
  links?: { label?: string; url?: string }[];
  coverImage?: { url?: string };
  gallery?: { url?: string; alt?: string; caption?: string; width?: number; height?: number }[];
  body?: Block[];
  myContribution?: Block[];
};

const PROJECT_QUERY = groq`*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  summary,
  role,
  tags,
  description,
  "slug": slug.current,
  year,
  projectType,
  client,
  location,
  links,
  "coverImage": { "url": coalesce(coverImage.asset->url, "") },
  "gallery": gallery[]{
    "url": coalesce(image.asset->url, ""),
    alt,
    caption,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height
  },
  body,
  myContribution
}`;

const portableComponents: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => <h3 className="text-xl font-semibold leading-tight">{children}</h3>,
    h3: ({ children }) => <h4 className="text-lg font-semibold leading-tight">{children}</h4>,
    normal: ({ children }) => <p className="text-base leading-7 whitespace-pre-line">{children}</p>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => (
      <a href={(value as { href?: string })?.href} className="underline underline-offset-4 hover:text-emerald-400">
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-base leading-7">{children}</li>,
    number: ({ children }) => <li className="text-base leading-7">{children}</li>,
  },
};

const renderBlocks = (blocks?: Block[]) =>
  blocks?.length ? <PortableText value={blocks as PortableTextBlock[]} components={portableComponents} /> : null;

async function fetchProject(rawSlug?: string): Promise<ProjectDetail | null> {
  const slug = rawSlug?.toString().trim();
  if (!slug) return null;

  if (isSanityConfigured() && sanityClient) {
    const project = await sanityClient.fetch<ProjectDetail | null>(PROJECT_QUERY, { slug });
    if (project) return project;
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) return { title: "Project Not Found | Yuwei Li" };
  return { title: `${project.title} | Yuwei Li`, description: project.summary || project.description };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params;
  const project = await fetchProject(slug);

  return (
    <div className="relative min-h-screen text-neutral-900">
      <Navbar />
      {/* Background like home */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" />
        <Image
          src="/hero_mg.svg"
          alt="Hero background graphic"
          fill
          priority
          sizes="100vw"
          className="select-none object-contain object-[50%_10%] opacity-50 blur-md"
        />
      </div>

      <main className="mx-auto flex w-full max-w-9xl bg-neutral-100 flex-col gap-12 px-4 py-12 sm:px-40 sm:py-16">
        {/* Top light section */}
        <section className="flex flex-col gap-4">
          <Link href="/" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
            ← Back to projects
          </Link>

          {project ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Project</p>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold sm:text-4xl">{project.title}</h1>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-neutral-800">
                    {project.projectType && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        {project.projectType}
                      </span>
                    )}
                    {project.year && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        Year: {project.year}
                      </span>
                    )}
                    {project.location && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        Location: {project.location}
                      </span>
                    )}
                    {project.client && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        Client: {project.client}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-lg leading-7 text-neutral-700">{project.summary || project.description}</p>
              </div>

              {(project.role?.length || project.tags?.length) && (
                <div className="flex flex-wrap gap-2 text-xs text-neutral-700">
                  {project.role?.map((r) => (
                    <span key={r} className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 font-medium">
                      {r}
                    </span>
                  ))}
                  {project.tags?.map((tag) => (
                    <span key={tag} className="rounded-full border border-neutral-200 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold text-neutral-900">Project not found</h1>
              <p className="text-sm text-neutral-700">
                We couldn&apos;t find this project. Try another link or check your Sanity content.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Bottom dark section like work */}
      {project && (
        <section className="w-full bg-neutral-950 px-4 pb-16 pt-16 text-white sm:px-6 sm:pb-20 sm:pt-20 scroll-mt-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            {project.coverImage?.url && (
              <div className="overflow-hidden">
                <img
                  src={project.coverImage.url}
                  alt={project.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {project.body?.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Details</h2>
                <div className="space-y-3 text-neutral-400">{renderBlocks(project.body)}</div>
              </section>
            ) : null}

            {project.myContribution?.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">My Contribution</h2>
                <div className="space-y-3 text-neutral-400">{renderBlocks(project.myContribution)}</div>
              </section>
            ) : null}

            {project.links?.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Links</h2>
                <ul className="space-y-2 text-sm text-neutral-200">
                  {project.links.map((link, idx) => (
                    <li key={idx}>
                      {link.url ? (
                        <a href={link.url} className="text-emerald-300 underline hover:text-emerald-200">
                          {link.label || link.url}
                        </a>
                      ) : (
                        <span>{link.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          {project.gallery?.length ? (
            <div className="mt-32">
              <ProjectGallery items={project.gallery} columns="3" fullWidth />
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
