import Image from "next/image";
import { Link } from "next-view-transitions";

import { buildScaledUrl } from "@/lib/media";
import { getExternalLinkProps } from "@/lib/safe-url";
import { CoverVideo } from "./cover-video";
import type { ProjectDetail } from "@/lib/view-models/types";
import { ProjectGallery } from "./project-gallery";
import { DotList, MetaRow } from "./project-meta-table";
import { ProjectRichText } from "./project-rich-text";
import { ProjectSections } from "./project-sections";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

export function ProjectDetailView({
  project,
  locale,
  dictionary,
}: {
  project: ProjectDetail;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const hasContribution =
    project.contributors.length ||
    project.role.length ||
    project.tags.length ||
    project.myContribution.length;
  const hasProjectCredits = hasContribution || project.links.length;

  return (
    // main 覆盖整篇正文：浅色信息区 + 深色内容区 + 画廊都属于页面主体，
    // 只包住头部会让 landmark 只覆盖到很小一部分内容
    <main id="main-content" className="relative min-h-screen text-design-light-text-primary">
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

      <div className="w-full bg-design-light-bg px-container pb-panel pt-24 sm:px-container-sm sm:pb-panel-sm sm:pt-28">
        <div className="mx-auto max-w-content flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            <Link href={`${localizedPath(locale)}#work`} className="text-small font-medium text-design-light-text-secondary transition-colors duration-base hover:text-design-light-text-primary">
              {dictionary.project.back}
            </Link>

            <div className="space-y-5">
              <p className="text-label font-semibold uppercase text-design-light-text-muted">{dictionary.project.eyebrow}</p>
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
              <div className="relative aspect-video w-full overflow-hidden">
                {project.coverVideo ? (
                  // 有封面视频时它占据 hero 位，封面图作为 poster 首帧
                  <CoverVideo
                    src={project.coverVideo.url}
                    poster={buildScaledUrl(project.coverImage.url, {
                      width: 1600,
                      animated: project.coverImage.animated,
                    })}
                    className="h-full w-full object-cover"
                    playLabel={dictionary.project.playVideo}
                    pauseLabel={dictionary.project.pauseVideo}
                  />
                ) : (
                  <Image
                    src={project.coverImage.url}
                    alt={project.coverImage.alt}
                    fill
                    priority
                    // 动图（GIF）必须跳过 Next 的图片优化，否则动画会被压成静帧
                    unoptimized={project.coverImage.animated}
                    className="object-cover"
                    sizes="(min-width: 1024px) 1152px, 100vw"
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6 border-t border-design-light-border sm:gap-x-12">
              {project.projectType && <MetaRow label={dictionary.project.type}>{project.projectType}</MetaRow>}
              {project.year && <MetaRow label={dictionary.project.year}>{project.year}</MetaRow>}
              {project.client && <MetaRow label={dictionary.project.client}>{project.client}</MetaRow>}
              {project.location && <MetaRow label={dictionary.project.location}>{project.location}</MetaRow>}
            </div>
          </section>
        </div>
      </div>

      <section data-overscroll-dark className="w-full bg-design-dark-bg px-container py-panel text-design-dark-text-primary sm:px-container-sm sm:py-panel-sm scroll-mt-24">
        <div className="mx-auto max-w-content">
          {/* 正文：可增删排序的内容模块 */}
          <ProjectSections sections={project.sections} labels={dictionary.project} />
        </div>
      </section>

      {hasProjectCredits ? (
        <section
          data-overscroll-dark
          className="w-full bg-design-dark-bg px-container pb-panel text-design-dark-text-primary sm:px-container-sm sm:pb-panel-sm"
        >
          <div className="mx-auto max-w-content">
            {project.links.length ? (
              <ul className="mb-6 flex flex-wrap justify-start gap-3">
                {project.links.map((link) => {
                  const href = link.href;
                  const label =
                    ["official website", "sito ufficiale"].includes(
                      link.label?.trim().toLowerCase() ?? "",
                    )
                      ? dictionary.project.visitOfficial
                      : link.label || dictionary.project.visitProject;

                  return (
                    <li key={link.key}>
                      {href ? (
                        <a
                          href={href}
                          {...getExternalLinkProps(href)}
                          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap border border-design-dark-border-strong bg-design-dark-surface px-3 py-1.5 text-xs font-medium text-design-dark-text-secondary transition-[background-color,color,transform] duration-base hover:scale-emphasis hover:bg-design-dark-elevated hover:text-design-dark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-design-dark-bg"
                        >
                          {label}
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <span className="text-small text-design-dark-text-secondary">
                          {link.label || link.originalUrl}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div className="border-t border-design-dark-border-strong pt-panel sm:pt-panel-sm">
              <h2 className="text-2xl font-semibold leading-tight text-design-dark-text-primary sm:text-3xl">
                {dictionary.project.credits}
              </h2>

              <div className="mt-6 grid gap-10 sm:mt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16 lg:gap-24">
                <div className="min-w-0">
                  {project.myContribution.length ? (
                    <div className="text-design-dark-text-secondary">
                      <ProjectRichText blocks={project.myContribution} scale="compact" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0">
                  {project.contributors.length || project.role.length || project.tags.length ? (
                    <div className="border-t border-design-dark-border">
                      {project.contributors.length ? (
                        <MetaRow label={dictionary.project.contributors} tone="dark" density="compact">
                          <DotList
                            items={project.contributors}
                            separatorClassName="text-design-dark-border-strong"
                          />
                        </MetaRow>
                      ) : null}
                      {project.role.length ? (
                        <MetaRow label={dictionary.project.roles} tone="dark" density="compact">
                          <DotList
                            items={project.role}
                            separatorClassName="text-design-dark-border-strong"
                          />
                        </MetaRow>
                      ) : null}
                      {project.tags.length ? (
                        <MetaRow label={dictionary.project.skills} tone="dark" density="compact">
                          <DotList
                            items={project.tags}
                            separatorClassName="text-design-dark-border-strong"
                          />
                        </MetaRow>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {project.gallery.length ? (
        <section
          data-overscroll-dark
          className="w-full bg-design-dark-bg px-container pb-panel text-design-dark-text-primary sm:px-container-sm sm:pb-panel-sm"
        >
          <div className="-mx-4 px-4 sm:-mx-6 sm:px-10">
            <ProjectGallery
              items={project.gallery}
              title={dictionary.project.gallery}
              playVideoLabel={dictionary.project.playGalleryVideo}
              viewImageLabel={dictionary.project.viewGalleryImage}
              fullWidth
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}
