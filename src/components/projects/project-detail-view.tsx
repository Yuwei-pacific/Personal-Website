import { Link } from "next-view-transitions";

import { MaskedTextHeading } from "@/components/ui/masked-text-heading";
import { SanityImage } from "@/components/ui/sanity-image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { textLink } from "@/components/ui/text-link";
import { buildScaledUrl } from "@/lib/media";
import { getExternalLinkProps } from "@/lib/safe-url";
import type { Project, ProjectDetail } from "@/lib/view-models/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

import { CoverVideo } from "./cover-video";
import { CustomBody, hasCustomBody } from "./custom";
import { NextProject } from "./next-project";
import { ProjectGallery } from "./project-gallery";
import { MetaItem, MetaList, joinMeta } from "@/components/ui/meta-list";
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

// 封面的原始尺寸：Sanity 资源地址的文件名里带着（…-1575x852.png）。详情查询没有单独取尺寸，
// 从地址里读就够了；读不到时按 16:10 处理
function coverSize(url: string) {
  const match = /-(\d+)x(\d+)\.[a-z0-9]+(?:\?.*)?$/i.exec(url);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : { width: 1600, height: 1000 };
}

// 编辑式长卷：首屏（标题 / 简介 / 元信息 / 外链）→ 完整的封面大图 → 正文（章节）
// → Credits → 画廊 → 下一个项目。全页用首页同款的贴边页边距（px-edge），不再居中收窄。
// 同一张纸正常往下滚（不叠纸，和首页、About 一致），区块底色在纸 / 纸 2 / 纸之间轮换。
// 封面是完整的原图，不放进墨里（试过，用户 2026-11-16：内页需要项目大图完整展示）—— 墨滩会裁掉四边、
// 还给作品图加了一圈东西；手册也写了作品图片保持原样。内页唯一的墨滩是结尾「下一个项目」的缩略图。
// 分隔线是墨线（ui/ink-rule.tsx）。
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

  // 标题上方那一行：类型 — 年份
  const kicker = [project.projectType, project.year].filter(Boolean).join(" — ");

  // 登记了自定义正文的项目（见 custom/index.ts）：章节换成专门写的组件，画廊由它自己排
  const custom = hasCustomBody(project.slug);

  const hasCredits =
    project.myContribution.length > 0 ||
    project.contributors.length > 0 ||
    project.tags.length > 0 ||
    links.length > 0;

  return (
    // main 覆盖整篇正文：头部和封面（纸）+ 正文与画廊（纸 2）+ 下一个项目（纸）都属于页面主体
    <main id="main-content" className="relative min-h-screen text-design-light-text-primary">
      {/* 三段：首屏 + 封面（纸）→ 正文（纸 2）→ 下一个项目（纸）。
          之前是三张纸叠放（position: sticky）：滚动时正文那张纸会从下面盖上来，把封面盖掉一半 —— 去掉了。
          为了不让整份文件多缩进一层，这三段的子元素保持原缩进 */}
      <div className="surface-base bg-background">
      {/* ── 头部：标题 → 封面 → 资料与简介。
          次序是「是什么（标题 + 一行类型和年份）→ 长什么样（封面）→ 细节（资料、简介、外链）」。
          之前是标题下面左边简介、右边五行资料表，然后才是封面：标题右边空着一大块，
          资料表又把封面挤到第一屏之外，进来先看到的是一张表。现在第一屏是标题和作品本身；
          资料和简介排在封面下面，用正文章节同一套栏位（左栏标签 / 右栏内容），头部和正文是一条轴线 ── */}
      <header className="px-edge pt-28 sm:px-edge-sm sm:pt-32">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 text-small text-design-light-text-secondary">
          <Link
            href={`${localizedPath(locale)}#work`}
            className="transition-colors duration-base hover:text-design-light-text-primary"
          >
            {d.back}
          </Link>
          {/* 一行就说清这是什么：类型 — 年份（它们不再占资料表的两行） */}
          {kicker ? <p className="text-design-light-text-muted">{kicker}</p> : null}
        </div>

        <MaskedTextHeading
          as="h1"
          text={project.title}
          className="mt-5 text-balance pb-8 font-display text-[13vw] leading-[0.95] tracking-display sm:mt-6 sm:pb-10 sm:text-[clamp(3.5rem,10vw,9rem)]"
        />
      </header>

      {/* ── 封面：完整的原图，按原始比例占满版心，不裁切、不加效果 ──
          （进入项目的过场是一滩墨漫开，见 ink-transition.tsx；封面不再从首页的位置滑过来） */}
      {project.coverImage ? (
        <div className="px-edge pb-12 sm:px-edge-sm sm:pb-16">
          <div className="relative w-full overflow-hidden bg-design-dark-bg">
            {(() => {
              const size = coverSize(project.coverImage.url);
              return project.coverVideo ? (
                // 有封面视频时它占据封面位（按封面图的比例），封面图作为 poster 首帧
                <div style={{ aspectRatio: `${size.width} / ${size.height}` }}>
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
                </div>
              ) : (
                <SanityImage
                  // 这张是详情页的 LCP 元素，由浏览器按 srcset 直连 Sanity CDN。
                  // 2880 是 loader 的宽度上限：封面横贯整页，2 倍屏上 1440 宽的窗口要这么多像素
                  // （之前是 2048，高分屏的大窗口里封面是被放大的、发软）。不会超过原图，窄屏仍按 srcset 取小档
                  src={buildScaledUrl(project.coverImage.url, {
                    width: 2880,
                    animated: project.coverImage.animated,
                  })}
                  alt={project.coverImage.alt}
                  width={size.width}
                  height={size.height}
                  preload
                  sizes="100vw"
                  className="h-auto w-full"
                />
              );
            })()}
          </div>
        </div>
      ) : null}

      {/* ── 简介与资料：左边是大字简介和外链（占 7 栏），右边 4 栏是资料
          （我的角色排第一：访客最先想知道我在这个项目里做了什么）。一左一右把这一行撑满。
          试过资料在左 3 栏、简介从第 4 栏起（和章节同一套栏位）：简介的行宽有限，右边三分之一是空的，
          整行都挤在左边（用户 2026-11-16）。单列（手机）时也是简介在前、资料在后 ── */}
      <div className={`px-edge pb-14 sm:px-edge-sm sm:pb-20 ${SECTION_GRID}`}>
        <MetaList tone="light" className="order-2 self-start md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
          {project.role.length ? (
            <MetaItem tone="light" label={d.roles}>{joinMeta(project.role)}</MetaItem>
          ) : null}
          {project.client ? <MetaItem tone="light" label={d.client}>{project.client}</MetaItem> : null}
          {project.location ? (
            <MetaItem tone="light" label={d.location}>{project.location}</MetaItem>
          ) : null}
        </MetaList>

        <div className="order-1 flex flex-col gap-8 md:col-span-6 lg:col-span-7">
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
                    className={textLink("md", "gap-2")}
                  >
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      </div>

      {/* ── 正文、Credits、画廊：同一段，共用章节间距 ── */}
      <div className="surface-alt bg-background">
      <div
        // 上边距比下边距小：头部那一行下面已经留过白，两段的留白叠在一起会空出大半屏
        className="bg-design-dark-bg px-edge pb-section pt-14 text-design-dark-text-primary sm:px-edge-sm sm:pb-section-sm sm:pt-20"
      >
        <div className={`flex flex-col ${CHAPTER_GAP}`}>
          {/* 可增删排序的内容模块 */}
          {custom ? (
            <CustomBody project={project} locale={locale} dictionary={dictionary} />
          ) : (
            <ProjectSections sections={project.sections} labels={d} />
          )}

          {hasCredits ? (
            <section>
              <SectionRule variant={2} />
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

          {!custom && project.gallery.length ? (
            <ProjectGallery
              items={project.gallery}
              title={d.gallery}
              playVideoLabel={d.playGalleryVideo}
              viewImageLabel={d.viewGalleryImage}
            />
          ) : null}
        </div>
      </div>

      </div>

      {next ? (
        <div className="surface-base overflow-x-clip bg-background">
          <NextProject project={next.project} position={next.position} label={d.nextProject} locale={locale} />
        </div>
      ) : null}
    </main>
  );
}
