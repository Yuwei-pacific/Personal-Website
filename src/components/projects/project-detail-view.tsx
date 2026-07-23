import Image from "next/image";
import { Link } from "next-view-transitions";

import { getExternalLinkProps } from "@/lib/safe-url";
import type { ProjectDetail } from "@/lib/view-models/types";
import { ProjectGallery } from "./project-gallery";
import { DotList, MetaRow } from "./project-meta-table";
import { ProjectRichText } from "./project-rich-text";

export function ProjectDetailView({ project }: { project: ProjectDetail }) {
  return (
    <div className="relative min-h-screen text-design-light-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" />
        <Image
          src="/hero_mg.svg"
          alt=""
          fill
          sizes="100vw"
          className="select-none object-contain object-[50%_10%] opacity-50 blur-md"
        />
      </div>

      <main className="w-full bg-design-light-bg px-container pb-section pt-24 sm:px-container-sm sm:pb-section-sm sm:pt-28">
        <div className="mx-auto max-w-6xl flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            <Link href="/#work" className="text-small font-medium text-design-light-text-secondary transition-colors duration-base hover:text-design-light-text-primary">
              ← Back to projects
            </Link>

            <div className="space-y-5">
              <p className="text-label font-semibold uppercase text-design-light-text-muted">Project</p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-design-light-text-primary sm:text-5xl lg:text-6xl">
                {project.title}
              </h1>
            </div>

            {project.summary && (
              <div className="border-t border-design-light-border pt-6">
                <p className="max-w-4xl text-pretty text-lg leading-relaxed text-design-light-text-secondary sm:text-xl">
                  {project.summary}
                </p>
              </div>
            )}

            {project.coverImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-media">
                <Image
                  src={project.coverImage.url}
                  alt={project.coverImage.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 1152px, 100vw"
                />
              </div>
            )}

            <div className="border-t border-design-light-border">
              {project.projectType && <MetaRow label="Type">{project.projectType}</MetaRow>}
              {project.year && <MetaRow label="Year">{project.year}</MetaRow>}
              {project.location && <MetaRow label="Location">{project.location}</MetaRow>}
              {project.client && <MetaRow label="Client">{project.client}</MetaRow>}
              {project.contributors.length ? (
                <MetaRow label="Contributors">
                  <DotList items={project.contributors} separatorClassName="text-design-light-border" />
                </MetaRow>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <section data-overscroll-dark className="w-full bg-design-dark-bg px-container py-section text-design-dark-text-primary sm:px-container-sm sm:py-section-sm scroll-mt-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          {project.body.length ? (
            <section>
              <div className="text-design-dark-text-secondary">
                <ProjectRichText blocks={project.body} />
              </div>
            </section>
          ) : null}

          {project.role.length || project.tags.length || project.myContribution.length ? (
            <section className="border-t border-design-dark-border-strong pt-10">
              <h2 className="text-2xl font-semibold leading-tight text-design-dark-text-primary sm:text-3xl">My Contribution</h2>
              {project.role.length || project.tags.length ? (
                <div className="mt-6 border-t border-design-dark-border">
                  {project.role.length ? (
                    <MetaRow label="Roles" tone="dark">
                      <DotList items={project.role} separatorClassName="text-design-dark-border-strong" />
                    </MetaRow>
                  ) : null}
                  {project.tags.length ? (
                    <MetaRow label="Skills" tone="dark">
                      <DotList items={project.tags} separatorClassName="text-design-dark-border-strong" />
                    </MetaRow>
                  ) : null}
                </div>
              ) : null}
              {project.myContribution.length ? (
                <div className="mt-6 text-design-dark-text-secondary">
                  <ProjectRichText blocks={project.myContribution} />
                </div>
              ) : null}
            </section>
          ) : null}

          {project.links.length ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-design-dark-text-primary">Links</h2>
              <ul className="space-y-2 text-small text-design-dark-text-secondary">
                {project.links.map((link) => {
                  const href = link.href;
                  return (
                    <li key={link.key}>
                      {href ? (
                        <a href={href} {...getExternalLinkProps(href)} className="text-design-dark-text-secondary underline underline-offset-4 transition-colors duration-base hover:text-design-dark-text-primary">
                          {link.label}
                        </a>
                      ) : (
                        <span>{link.label || link.originalUrl}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
        {project.gallery.length ? (
          <div className="mt-32 -mx-4 sm:-mx-6 px-4 sm:px-10">
            <ProjectGallery items={project.gallery} fullWidth />
          </div>
        ) : null}
      </section>
    </div>
  );
}
