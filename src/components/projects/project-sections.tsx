// 项目正文：把内容模块编成「章节」渲染。
// 带小标题的模块开启一个新章节（上方细线 + 左栏编号小标题 + 右栏正文）；
// 紧随其后的无标题模块（媒体、媒体组、引用、无标题文字）归入同一章节。
// 小标题在桌面端沿着本章节的正文吸顶。
// 间距分两档：章节内部贴近，章节之间拉开 —— 配图要离它所属的文字比离下一章近。
// 模块自身不带外边距，间距统一在这里控制。
// 媒体只有两种宽度：正文栏和通栏（Sanity 里的 Full width），都撑满到右缘。
// 偏高的媒体坐在撑满栏宽的底板上（见 section-media.tsx），不另设「窄图」「图文并排」这类版式 ——
// 每个项目的每一章都是同一个节奏：文字在上，一块横向的图在下。
import type { ReactNode } from "react";

import { InkRule } from "@/components/ui/ink-rule";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { ProjectSection } from "@/lib/view-models/types";
import type { Dictionary } from "@/i18n/dictionaries";

import { ProjectRichText } from "./project-rich-text";
import { SectionMedia, SectionMediaGroup, hasTallMedia, type MediaLabels } from "./section-media";

// 12 列骨架，和 About 页同一条轴线：左 3 列放编号与小标题（桌面吸顶），正文从第 4 列起。
// md 到 lg 之间屏幕窄，左栏给 4 列，不然小标题挤不下。头部的资料 / 简介那一行也用这一套
export const SECTION_GRID = "grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-12";
export const SECTION_LABEL_COL = "md:col-span-4 lg:col-span-3";
export const SECTION_TEXT_COL = "md:col-span-8 md:col-start-5 lg:col-span-9 lg:col-start-4";
// 正文 measure：约 62 个字符一行
export const SECTION_MEASURE = "max-w-[62ch]";
// 章节之间 / 章节内部的两档间距
export const CHAPTER_GAP = "gap-24 sm:gap-36";
const BLOCK_GAP = "gap-10 sm:gap-14";

const pad = (n: number) => String(n).padStart(2, "0");

// 章节顶上的线：墨线（和 About 页、页脚同一种画法）。每章取一种起伏
export function SectionRule({ variant = 0 }: { variant?: number }) {
  return <InkRule variant={variant} className="mb-8 text-design-dark-text-primary sm:mb-10" />;
}

// 左栏小标题：吸顶和入场动画都落在 grid item 这一层 ——
// sticky 的活动范围是它所在的 grid，所以同一章节的正文栏内容必须和它放进同一个 grid。
export function SectionLabel({ index, children }: { index?: number; children: ReactNode }) {
  return (
    <ScrollReveal className={`md:sticky md:top-28 md:self-start ${SECTION_LABEL_COL}`}>
      {index ? (
        <p aria-hidden="true" className="mb-3 font-mono text-small text-design-dark-text-muted">
          {pad(index)}
        </p>
      ) : null}
      <h2 className="max-w-[16ch] text-balance font-display text-3xl leading-[1.1] text-design-dark-text-primary lg:text-section">
        {children}
      </h2>
    </ScrollReveal>
  );
}

type Labels = Dictionary["project"];
type BlockProps = { section: ProjectSection; priority: boolean; labels: Labels };

const mediaLabels = (labels: Labels): MediaLabels => ({
  playLabel: labels.playVideo,
  pauseLabel: labels.pauseVideo,
  zoomLabel: labels.viewGalleryImage,
});

// 落在正文栏里的模块：文字、图文、非全宽媒体、带竖版媒体的媒体组。
// 其余（全宽媒体、横图媒体组、引用）横跨版心。
// 竖版媒体组限了高，给它通栏只是多出空底板，所以留在正文栏，和上面的文字同一条左缘
const isColumnBlock = (section: ProjectSection) =>
  section.kind === "richText" ||
  section.kind === "mediaText" ||
  (section.kind === "media" && !section.fullWidth) ||
  (section.kind === "mediaGroup" && hasTallMedia(section.items));

// 媒体组在两种宽度里渲染是一样的，区别只在它被放进哪一栏（见 isColumnBlock）
function MediaGroupBlock({ section, labels }: { section: Extract<ProjectSection, { kind: "mediaGroup" }>; labels: Labels }) {
  return <SectionMediaGroup items={section.items} caption={section.caption} labels={mediaLabels(labels)} />;
}

function ColumnBlock({ section, priority, labels }: BlockProps) {
  switch (section.kind) {
    case "richText":
      return (
        <div className={`${SECTION_MEASURE} text-design-dark-text-secondary`}>
          <ProjectRichText blocks={section.content} />
        </div>
      );

    case "mediaText":
      // 文字在上、媒体在下：小标题留在左栏吸顶，读完文字再看图。
      // 媒体始终撑满正文栏，Media position 不改变版式
      return (
        <div className="flex flex-col gap-10">
          <div className={`${SECTION_MEASURE} text-design-dark-text-secondary`}>
            <ProjectRichText blocks={section.content} />
          </div>
          <SectionMedia media={section.media} slot="column" priority={priority} labels={mediaLabels(labels)} />
        </div>
      );

    case "media":
      return <SectionMedia media={section.media} slot="column" priority={priority} labels={mediaLabels(labels)} />;

    case "mediaGroup":
      return <MediaGroupBlock section={section} labels={labels} />;

    default:
      return null;
  }
}

function WideBlock({ section, priority, labels }: BlockProps) {
  switch (section.kind) {
    case "media":
      return <SectionMedia media={section.media} slot="full" priority={priority} labels={mediaLabels(labels)} />;

    case "mediaGroup":
      return <MediaGroupBlock section={section} labels={labels} />;

    case "quote":
      return (
        <figure className={SECTION_GRID}>
          <blockquote className="text-balance text-3xl font-semibold leading-[1.12] tracking-[-0.02em] text-design-dark-text-primary md:col-span-10 md:col-start-2 lg:text-5xl">
            “{section.quote}”
          </blockquote>
          {section.attribution ? (
            <figcaption className="font-mono text-small text-design-dark-text-muted md:col-span-10 md:col-start-2">
              — {section.attribution}
            </figcaption>
          ) : null}
        </figure>
      );

    default:
      return null;
  }
}

type ChapterBlock = { section: ProjectSection; position: number };

type Chapter = {
  key: string;
  /** 带标题的章节才有编号、小标题和章节线 */
  index?: number;
  heading?: string;
  blocks: ChapterBlock[];
};

const headingOf = (section: ProjectSection) =>
  (section.kind === "richText" || section.kind === "mediaText") && section.heading
    ? section.heading
    : undefined;

function toChapters(sections: ProjectSection[]): Chapter[] {
  const chapters: Chapter[] = [];
  let counter = 0;

  sections.forEach((section, position) => {
    const heading = headingOf(section);
    const current = chapters[chapters.length - 1];
    if (heading || !current) {
      chapters.push({
        key: section.key,
        index: heading ? ++counter : undefined,
        heading,
        blocks: [{ section, position }],
      });
      return;
    }
    current.blocks.push({ section, position });
  });

  return chapters;
}

// 章节内部再分「段」：连续的正文栏模块合成一段，共用一个 grid ——
// 第一段的 grid 里放小标题，它就能沿着整段正文吸顶，而不是只跟着第一个模块。
// 横跨版心的模块各自成段，会把吸顶范围截断在它上方。
type Run = { column: boolean; blocks: ChapterBlock[] };

function toRuns(blocks: ChapterBlock[]): Run[] {
  const runs: Run[] = [];

  for (const block of blocks) {
    const column = isColumnBlock(block.section);
    const current = runs[runs.length - 1];
    if (column && current?.column) {
      current.blocks.push(block);
    } else {
      runs.push({ column, blocks: [block] });
    }
  }

  return runs;
}

function ChapterView({ chapter, labels }: { chapter: Chapter; labels: Labels }) {
  const runs = toRuns(chapter.blocks);
  // 小标题跟第一段走；如果章节以横跨模块开头（理论上不会，标题只来自正文栏模块），单独占一行
  const labelInFirstRun = Boolean(chapter.heading) && runs[0]?.column;
  const label = chapter.heading ? (
    <SectionLabel index={chapter.index}>{chapter.heading}</SectionLabel>
  ) : null;

  return (
    <section>
      {chapter.heading ? <SectionRule variant={chapter.index ?? 0} /> : null}
      <div className={`flex flex-col ${BLOCK_GAP}`}>
        {label && !labelInFirstRun ? <div className={SECTION_GRID}>{label}</div> : null}
        {runs.map((run, runIndex) =>
          run.column ? (
            <div key={run.blocks[0].section.key} className={SECTION_GRID}>
              {runIndex === 0 && labelInFirstRun ? label : null}
              <div className={`${SECTION_TEXT_COL} flex flex-col ${BLOCK_GAP}`}>
                {run.blocks.map(({ section, position }) => (
                  <ScrollReveal key={section.key}>
                    {/* 首个模块的媒体参与首屏，交给 Next 优先加载 */}
                    <ColumnBlock section={section} priority={position === 0} labels={labels} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          ) : (
            run.blocks.map(({ section, position }) => (
              <ScrollReveal key={section.key}>
                <WideBlock section={section} priority={position === 0} labels={labels} />
              </ScrollReveal>
            ))
          ),
        )}
      </div>
    </section>
  );
}

export function ProjectSections({ sections, labels }: { sections: ProjectSection[]; labels: Labels }) {
  if (!sections.length) return null;

  return (
    <div className={`flex w-full flex-col ${CHAPTER_GAP}`}>
      {toChapters(sections).map((chapter) => (
        <ChapterView key={chapter.key} chapter={chapter} labels={labels} />
      ))}
    </div>
  );
}
