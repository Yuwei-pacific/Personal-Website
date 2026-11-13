import { Link } from "next-view-transitions";

import { MaskedTextHeading } from "@/components/ui/masked-text-heading";
import { Parallax } from "@/components/ui/parallax";
import { SanityImage } from "@/components/ui/sanity-image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { buildScaledUrl } from "@/lib/media";
import { getExternalLinkProps } from "@/lib/safe-url";
import type { Project, ProjectDetail } from "@/lib/view-models/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

import { CoverTransitionTarget } from "./cover-transition";
import { CoverVideo } from "./cover-video";
import { NextProject } from "./next-project";
import { ProjectGallery } from "./project-gallery";
import { MetaItem, MetaList, joinMeta } from "./project-meta-table";
import { ProjectRichText } from "./project-rich-text";
import {
  CHAPTER_GAP,
  ProjectSections,
  SECTION_GRID,
  SECTION_MEASURE,
  SECTION_TEXT_COL,
  SectionLabel,
  SectionRule,
} from "./project-sections";

// 编辑式长卷：浅色首屏（标题 / 简介 / 元信息 / 外链）→ 出血封面 → 深色正文（章节）
// → Credits → 画廊 → 下一个项目。全页用首页同款的贴边页边距（px-edge），不再居中收窄。
export function ProjectDetailView({
  project,
  next,
  locale,
  dictionary,
}: {
  project: ProjectDetail;
  next: { project: Project; position: number } | null;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const d = dictionary.project;

  // 只保留能安全跳转的链接；「官方网站」这类通用标签换成当前语言的界面文案
  const links = project.links.flatMap((link) =>
    link.href
      ? [
          {
            key: link.key,
            href: link.href,
            label: ["official website", "sito ufficiale"].includes(link.label.trim().toLowerCase())
              ? d.visitOfficial
              : link.label || d.visitProject,
          },
        ]
      : [],
  );

  const hasCredits =
    project.myContribution.length > 0 ||
    project.contributors.length > 0 ||
    project.tags.length > 0 ||
    links.length > 0;

  return (
    // main 覆盖整篇正文：浅色首屏 + 深色内容区 + 画廊 + 下一个项目都属于页面主体
    <main id="main-content" className="relative min-h-screen text-design-light-text-primary">
      {/* ── 首屏：第一屏内交代清楚「是什么、我做了什么、去哪看」 ── */}
      <header className="bg-design-light-bg px-edge pt-28 sm:px-edge-sm sm:pt-32">
        <Link
          href={`${localizedPath(locale)}#work`}
          className="text-small font-medium text-design-light-text-secondary transition-colors duration-base hover:text-design-light-text-primary"
        >
          {d.back}
        </Link>

        <MaskedTextHeading
          as="h1"
          text={project.title}
          className="mt-6 text-balance text-[13vw] font-semibold leading-[0.95] tracking-display sm:mt-8 sm:text-[clamp(3.5rem,10vw,9rem)]"
        />

        <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-10 pb-10 sm:mt-14 sm:pb-14 md:grid-cols-12">
          <div className="flex flex-col gap-8 md:col-span-6">
            {project.summary ? (
              <p className="text-pretty text-[1.375rem] leading-[1.2] tracking-[-0.02em] sm:text-[clamp(1.5rem,2.1vw,2rem)]">
                {project.summary}
              </p>
            ) : null}

            {/* 外链是整页最有价值的点击：与首页 Hero 的 CTA 同一种大号下划线文字链 */}
            {links.length ? (
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {links.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      {...getExternalLinkProps(link.href)}
                      className="inline-flex min-h-11 touch-manipulation items-center gap-2 border-b-2 border-current text-lg font-semibold leading-[1.3] tracking-[-0.02em] transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:min-h-0 sm:text-xl"
                    >
                      {link.label}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* 「我的角色」排第一：访客最先想知道我在这个项目里做了什么 */}
          <MetaList tone="light" className="self-end md:col-span-5 md:col-start-8">
            {project.role.length ? (
              <MetaItem tone="light" label={d.roles}>{joinMeta(project.role)}</MetaItem>
            ) : null}
            {project.projectType ? (
              <MetaItem tone="light" label={d.type}>{project.projectType}</MetaItem>
            ) : null}
            {project.year ? <MetaItem tone="light" label={d.year}>{project.year}</MetaItem> : null}
            {project.client ? <MetaItem tone="light" label={d.client}>{project.client}</MetaItem> : null}
            {project.location ? (
              <MetaItem tone="light" label={d.location}>{project.location}</MetaItem>
            ) : null}
          </MetaList>
        </div>
      </header>

      {/* ── 封面：左右出血，直接压在深浅分界上；也是卡片共享过渡的终点 ── */}
      {/* 比例随屏宽放扁：出血的 16:9 在大屏上会吃掉一整屏，桌面收到 2:1，并封顶在视口高度的 80% */}
      {project.coverImage ? (
        <CoverTransitionTarget className="relative aspect-[4/3] max-h-[80svh] w-full overflow-hidden bg-design-dark-bg sm:aspect-[16/9] lg:aspect-[2/1]">
          {project.coverVideo ? (
            // 有封面视频时它占据封面位，封面图作为 poster 首帧
            <CoverVideo
              src={project.coverVideo.url}
              poster={buildScaledUrl(project.coverImage.url, {
                width: 1600,
                animated: project.coverImage.animated,
              })}
              className="h-full w-full object-cover"
              playLabel={d.playVideo}
              pauseLabel={d.pauseVideo}
            />
          ) : (
            // 轻微视差：图片上下各多出 5% 作为位移余量，容器裁掉溢出部分
            <Parallax offset={70} className="absolute inset-x-0 -inset-y-[5%]">
              <div className="relative h-full w-full">
                <SanityImage
                  // 这张是详情页的 LCP 元素，由浏览器按 srcset 直连 Sanity CDN。
                  // 2048 是 loader 的宽度上限，与画廊 lightbox 的最大档
                  // （project-gallery 的 SLIDE_WIDTHS）一致。
                  src={buildScaledUrl(project.coverImage.url, {
                    width: 2048,
                    animated: project.coverImage.animated,
                  })}
                  alt={project.coverImage.alt}
                  fill
                  preload
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
          )}
        </CoverTransitionTarget>
      ) : null}

      {/* ── 正文、Credits、画廊：同一块深色面板，共用章节间距 ── */}
      <div
        data-overscroll-dark
        className="bg-design-dark-bg px-edge py-section text-design-dark-text-primary sm:px-edge-sm sm:py-section-sm"
      >
        <div className={`flex flex-col ${CHAPTER_GAP}`}>
          {/* 可增删排序的内容模块 */}
          <ProjectSections sections={project.sections} labels={d} />

          {hasCredits ? (
            <section>
              <SectionRule />
              <div className={SECTION_GRID}>
                <SectionLabel>{d.credits}</SectionLabel>
                <ScrollReveal className={`${SECTION_TEXT_COL} flex flex-col gap-10`}>
                  {project.myContribution.length ? (
                    <div className={`${SECTION_MEASURE} text-design-dark-text-secondary`}>
                      <ProjectRichText blocks={project.myContribution} />
                    </div>
                  ) : null}

                  <MetaList tone="dark">
                    {project.contributors.length ? (
                      <MetaItem tone="dark" label={d.contributors}>{joinMeta(project.contributors)}</MetaItem>
                    ) : null}
                    {project.tags.length ? (
                      <MetaItem tone="dark" label={d.skills}>{joinMeta(project.tags)}</MetaItem>
                    ) : null}
                    {/* 读到结尾的人再给一次出口 */}
                    {links.length ? (
                      <MetaItem tone="dark" label={d.links}>
                        <span className="flex flex-wrap gap-x-5 gap-y-1">
                          {links.map((link) => (
                            <a
                              key={link.key}
                              href={link.href}
                              {...getExternalLinkProps(link.href)}
                              className="underline underline-offset-4 transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary"
                            >
                              {link.label} <span aria-hidden="true">↗</span>
                            </a>
                          ))}
                        </span>
                      </MetaItem>
                    ) : null}
                  </MetaList>
                </ScrollReveal>
              </div>
            </section>
          ) : null}

          {project.gallery.length ? (
            <ProjectGallery
              items={project.gallery}
              title={d.gallery}
              playVideoLabel={d.playGalleryVideo}
              viewImageLabel={d.viewGalleryImage}
            />
          ) : null}
        </div>
      </div>

      {next ? (
        <NextProject project={next.project} position={next.position} label={d.nextProject} locale={locale} />
      ) : null}
    </main>
  );
}
