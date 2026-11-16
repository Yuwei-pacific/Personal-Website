// 关于页：两段，同一张纸往下滚（不叠纸，和首页一致），底色是纸 / 纸 2。
//
//   ┌──────────────────────────────────────────────┐
//   │ ABOUT ME                                      │
//   │  ▄██▄    I’m Yuwei Li. I came from China to   │  人像：左 3 栏，显在一滩墨里
//   │ ██████   Florence to paint, then moved to …   │  大标题（h1）：从第 4 栏起，顶端和人像对齐
//   │ ██████   ~~~~~~~~~~~~~~~~~~~~  ~~~~~~~~~~~~~  │
//   │  ▀██▀    Today I work as a …   Role      …    │  现状（第 4 栏起）· 资料表（右 4 栏），挂在同一道线下
//   ├──────────────────────────────────────────────┤
//   │ Esperienza   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~     │  履历 / 能力：标题左 3 栏，行表格右 9 栏
//   └──────────────────────────────────────────────┘
//
// 整页用首页 Work 的 12 栏网格、贴页边：标签和标题在左 3 栏，内容从第 4 栏起，一条轴线贯穿两段。
// 这一页只有一处化开：托着人像的那一滩墨（portrait-drop.tsx），和首页作品封面显在墨滩里是同一个做法。
// 首屏的墨线和化开的字不搬到这里当装饰。分隔线都是墨线（ui/ink-rule.tsx）。
import Image from "next/image";

import { MetaItem, MetaList } from "@/components/ui/meta-list";
import { InkRule } from "@/components/ui/ink-rule";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { StaggerReveal } from "@/components/ui/stagger-reveal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { SITE_LOCATIONS, SITE_ROLE } from "@/lib/site-metadata";
import { cn } from "@/lib/utils";
import type { ResumeItem, SkillCategory } from "@/lib/view-models/types";

import { infoListClassName, infoRowFocusClassName } from "./info-list";
import { PortraitDrop } from "./portrait-drop";
import { ResumeList } from "./resume-list";

type AboutPageContentProps = {
  skillCategories?: SkillCategory[];
  resumeItems?: ResumeItem[];
  locale: Locale;
  dictionary: Dictionary;
};

// 三段共用的页边距
const edge = "px-edge sm:px-edge-sm";
// 12 栏网格：左 3 栏放标签 / 标题，右 9 栏放内容
const grid = "lg:grid lg:grid-cols-12 lg:gap-x-6";
/** 履历 / 能力的一块：标题在左 3 栏，列表在右 9 栏 */
function Block({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <ScrollReveal className={grid}>
      <div className="flex items-baseline gap-1.5 lg:col-span-3">
        <h2 className="font-display text-section text-design-light-text-primary">{title}</h2>
        <sup className="text-small text-design-light-text-muted">({count})</sup>
      </div>
      <div className="mt-6 lg:col-span-9 lg:mt-0">{children}</div>
    </ScrollReveal>
  );
}

export function AboutPageContent({
  skillCategories,
  resumeItems,
  locale,
  dictionary,
}: AboutPageContentProps) {
  const about = dictionary.about;
  // 分离 Education 和 Experience 数据
  const educations = resumeItems?.filter((item) => item.type === "education") || [];
  const experiences = resumeItems?.filter((item) => item.type === "experience") || [];
  // 内容来源只有 CMS：无数据时显示空状态，不再回退到仓库里的副本
  const categories = skillCategories ?? [];

  return (
    <main id="main-content" className="relative z-10 w-full bg-background">
      {/* 一、我是谁。只有两条竖线、两条横线，所有东西都挂在上面：
          - 竖线一是页边：小标签、人像的左缘；
          - 竖线二是第 4 栏（全页的内容轴线，下面履历的行表格也从这里起）：大标题、那段话的左缘；
          - 横线一是这一行的上缘：人像的顶和大标题第一行的顶；
          - 横线二是一道墨线：那段话和资料表都从它往下挂，两者顶端对齐。
          人像在左 3 栏（全页放「标签」的那一栏），墨滩的墨正好撑满这个框（见 portrait-drop.tsx），所以对齐的是墨本身。
          否掉的版本（用户 2026-11-16）：
          - 讲出处「墨分五色」的第一屏：访客来这页是看「我」的，出处留给将来的视觉识别案例；
          - 标题占左 8 栏、右边大人像、小字挂在中间、底下三行通栏资料：左下空一大块；
          - 标题横贯整页、下面人像 / 话 / 资料三样并排：三样的顶和底都对不上，人像比另外两样高一倍，底下空一大片；
          - 更早的「把设计和前端结合起来…」式大标题（模版化，首页也说过）。
          这一页只有人像那一处化开 */}
      <section className={cn("surface-base overflow-x-clip bg-background pb-16 pt-28 sm:pb-20 sm:pt-36 lg:pt-28", edge)}>
        <p className="text-label uppercase text-design-light-text-muted">{about.eyebrow}</p>

        <div className="mt-6 grid grid-cols-1 gap-y-10 md:grid-cols-12 md:items-start md:gap-x-6 md:gap-y-0">
          {/* 人像在一滩墨里（portrait-drop.tsx）。照片只在这一页出现一次。
              排版里这张 <img> 默认是透明的，看得见的是墨里的那张；只有确认画布不能用（data-ink="off"）或没有 JS 时它才显示。
              之前反过来（默认显示、画布就绪后才藏）：每次刷新，没有墨的原照片都会先闪一下 */}
          <div className="group/portrait relative order-2 aspect-[8/9] w-[min(100%,18rem)] md:order-1 md:col-span-4 md:w-full lg:col-span-3">
            <PortraitDrop />
            <Image
              src="/Profile_Yuwei.webp"
              alt={dictionary.common.portraitAlt}
              fill
              priority
              crossOrigin="anonymous"
              sizes="(min-width: 1024px) 25vw, 18rem"
              className="portrait-photo object-cover object-top opacity-0 group-data-[ink=off]/portrait:opacity-100"
            />
            <noscript>
              <style>{".portrait-photo{opacity:1!important}"}</style>
            </noscript>
          </div>

          {/* 手机上这一层不存在（contents）：标题、人像、下面那一行依次往下排。
              平板（md）起就是两栏：人像在左 4 栏，标题和下面的话、资料在右 8 栏往下排；lg 起话和资料才并排 */}
          <div className="contents md:order-2 md:col-span-8 md:block lg:col-span-9">
            {/* 上边距收掉行高里字顶以上的那一截，大写字母的顶才和人像的顶在一条线上 */}
            <h1 className="order-1 text-pretty font-display text-[clamp(2.25rem,5vw,5.25rem)] leading-[1.06] tracking-display text-design-light-text-primary md:-mt-[0.17em]">
              {about.intro.lead}
            </h1>

            <div className="order-3 grid grid-cols-1 gap-y-10 md:mt-10 lg:mt-14 lg:grid-cols-9 lg:gap-x-6 lg:gap-y-0">
              <div className="lg:col-span-5">
                <InkRule tone="soft" variant={1} className="hidden text-design-light-border-strong lg:block" />
                {/* 现状：和项目页的简介同一个字号；上边距和资料表第一行一样 */}
                <p className="max-w-[34ch] text-pretty text-[1.375rem] leading-[1.25] tracking-[-0.02em] text-design-light-text-primary sm:text-[clamp(1.5rem,1.9vw,1.875rem)] lg:pt-3">
                  {about.intro.body}
                </p>
              </div>
              <MetaList tone="light" className="self-start lg:col-span-4">
                <MetaItem tone="light" label={about.roleLabel}>{SITE_ROLE}</MetaItem>
                <MetaItem tone="light" label={about.locationLabel}>{SITE_LOCATIONS[locale]}</MetaItem>
                <MetaItem tone="light" label={about.languagesLabel}>
                  <span className="flex flex-col gap-0.5">
                    {about.languages.map((lang) => (
                      <span key={lang}>{lang}</span>
                    ))}
                  </span>
                </MetaItem>
              </MetaList>
            </div>
          </div>
        </div>
      </section>

      {/* 二、履历 + 能力（纸 2：和第一屏的纸交替） */}
      <section className={cn("surface-alt flex flex-col gap-20 bg-background py-section sm:gap-28 sm:py-section-sm", edge)}>
        {/* 经历在前、教育在后：客户和招聘方先看做过什么，再看在哪学的 */}
        <Block title={about.experience} count={experiences.length}>
          <ResumeList items={experiences} emptyLabel={about.resumeEmpty} />
        </Block>
        <Block title={about.education} count={educations.length}>
          <ResumeList items={educations} emptyLabel={about.resumeEmpty} />
        </Block>
        <Block title={about.capabilities} count={categories.length}>
          {!categories.length ? (
            <>
              <InkRule variant={2} />
              <p className="pt-4 text-small text-design-light-text-muted">{about.capabilitiesEmpty}</p>
            </>
          ) : (
            <>
            <InkRule variant={2} />
            <StaggerReveal className={infoListClassName}>
              {categories.map((category, i) => (
                // 外层是 StaggerReveal 的直接子元素，悬停聚焦加在内层（见 info-list.ts）
                <div key={category._id}>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-2 py-5 sm:grid-cols-[1fr_2fr] sm:items-baseline sm:gap-6",
                      infoRowFocusClassName,
                    )}
                  >
                    <p className="font-display text-[clamp(1.25rem,1.7vw,1.5rem)] leading-tight text-design-light-text-primary">
                      {category.title}
                    </p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-small text-design-light-text-secondary">
                      {category.skills?.map((item, i) => (
                        <span key={item} className="flex items-center gap-2">
                          {i > 0 && <span aria-hidden="true" className="text-design-light-text-muted">·</span>}
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <InkRule tone="soft" variant={i + 3} />
                </div>
              ))}
            </StaggerReveal>
            </>
          )}
        </Block>
      </section>
    </main>
  );
}
