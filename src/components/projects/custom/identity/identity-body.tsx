// 识别案例页的正文：出处 → 标志 → 五色 → 字与线 → 应用。
// 以图版为主，每章最多两句话（全页正文每种语言不超过约 200 词）—— 这一页是给人看的，不是给人读的。
// 文案在 i18n/case-identity.ts；位图来自这个项目的 Sanity 画廊；其余图版直接画。
// 全页活的墨只有 02 章作图动画结尾的那个标志：一屏最多一处化开（手册 07）。
// 03 章「纸上 / 夜里」两块是静止的样稿（只画一帧，不流动、不能搅），并排是为了对照，是这条规则在这一页的例外。
import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getCaseIdentityCopy } from "@/i18n/case-identity";
import { SITE_AUTHOR } from "@/lib/site-metadata";

import { SECTION_GRID, SECTION_MEASURE, SECTION_TEXT_COL, SectionLabel, SectionRule } from "../../project-sections";
import type { CustomBodyProps } from "../types";
import { ApplicationPlates } from "./application-plates";
import { ColorPlates } from "./color-plates";
import { LinePlates } from "./line-plates";
import { MarkPlates } from "./mark-plates";

// 一章：和模板的章节同一副骨架（顶上的墨线、左栏编号和标题、正文从第 4 栏起）
function Chapter({
  index,
  title,
  text,
  variant,
  children,
}: {
  index: number;
  title: string;
  text?: string;
  variant: number;
  children?: ReactNode;
}) {
  return (
    <section data-case-chapter={index}>
      <SectionRule variant={variant} />
      <div className={SECTION_GRID}>
        <SectionLabel index={index}>{title}</SectionLabel>
        <div className={`${SECTION_TEXT_COL} flex min-w-0 flex-col gap-10 sm:gap-14`}>
          {text ? (
            <ScrollReveal>
              <p
                className={`${SECTION_MEASURE} text-pretty text-base leading-relaxed text-design-dark-text-secondary sm:text-lg sm:leading-8`}
              >
                {text}
              </p>
            </ScrollReveal>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}

export function IdentityBody({ project, locale }: CustomBodyProps) {
  const copy = getCaseIdentityCopy(locale);

  return (
    <>
      <Chapter index={1} title={copy.origin.title} variant={0}>
        <ScrollReveal className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-8 sm:gap-12">
          {/* 「墨分五色」只在这里出现，宋体竖排（手册 10）。网站没有中文字体，用系统自带的宋体 */}
          <p
            lang="zh"
            className="text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.1] tracking-[0.12em] text-design-dark-text-primary [writing-mode:vertical-rl]"
            style={{ fontFamily: "'Songti SC','Noto Serif SC','SimSun',serif" }}
          >
            {copy.origin.name}
          </p>
          <div className="flex flex-col gap-5">
            <p className="font-mono text-small text-design-dark-text-muted">{copy.origin.reading}</p>
            {/* 出处是一段正文，不是标题：用 Geist 的大字，不用 Fraunces（手册 06） */}
            <p className="max-w-[34ch] text-pretty text-[1.375rem] leading-[1.25] tracking-[-0.02em] text-design-dark-text-primary sm:text-[clamp(1.5rem,2.1vw,2rem)]">
              {copy.origin.text}
            </p>
          </div>
        </ScrollReveal>
      </Chapter>

      <Chapter index={2} title={copy.mark.title} text={copy.mark.text} variant={1}>
        <MarkPlates copy={copy.mark} name={SITE_AUTHOR} />
      </Chapter>

      <Chapter index={3} title={copy.colors.title} text={copy.colors.text} variant={2}>
        <ColorPlates copy={copy.colors} />
      </Chapter>

      <Chapter index={4} title={copy.line.title} text={copy.line.text} variant={3}>
        <LinePlates copy={copy.line} />
      </Chapter>

      {/* 位图都在画廊里：一张都没有时这一章不出现，不留一个只有标题的空章 */}
      {project.gallery.length ? (
        <Chapter index={5} title={copy.inUse.title} text={copy.inUse.text} variant={0}>
          <ApplicationPlates items={project.gallery} />
        </Chapter>
      ) : null}
    </>
  );
}
