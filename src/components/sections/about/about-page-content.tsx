// 关于页：两段，同一张纸往下滚（不叠纸，和首页一致），底色是纸 / 纸 2。
//
//   ┌──────────────────────────────────────────────┐
//   │ CHI SONO                                      │
//   │ 墨   Nella pittura a inchiostro       ▄██▄    │  出处：四个字 + 这个说法（h1）+ 一句小字
//   │ 分   cinese si dice che un solo …    ██████   │  人像：右 4 栏，站在下面那道线上，外面一圈墨
//   │ 五   Lavoro allo stesso modo …       ██████   │
//   │~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~██████~~~│
//   │ Ruolo      Communication Designer & …         │  基本信息：标签左 3 栏，内容从第 4 栏起
//   ├──────────────────────────────────────────────┤
//   │ Formazione   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~     │  履历 / 能力：标题左 3 栏，行表格右 9 栏
//   └──────────────────────────────────────────────┘
//
// 整页用首页 Work 的 12 栏网格、贴页边：标签和标题在左 3 栏，内容从第 4 栏起，一条轴线贯穿两段。
// 这一页只有一处化开：人像外面那一圈墨（portrait-ink.tsx）。首屏的墨线和化开的字不搬到这里当装饰。
// 人像是抠像，直接落在纸上，下缘贴着基本信息顶上的线 —— 和 Work 里趴在线上的小人是同一个姿势。
// 分隔线都是墨线（ui/ink-rule.tsx）。
import Image from "next/image";

import { InkRule } from "@/components/ui/ink-rule";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { StaggerReveal } from "@/components/ui/stagger-reveal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { SITE_LOCATIONS, SITE_ROLE } from "@/lib/site-metadata";
import { cn } from "@/lib/utils";
import type { ResumeItem, SkillCategory } from "@/lib/view-models/types";

import { infoListClassName, infoRowFocusClassName } from "./info-list";
import { PortraitInk } from "./portrait-ink";
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
// 基本信息行：纯展示，不可点，只参与列表的悬停聚焦
const basicRow = cn(
  "grid grid-cols-1 gap-1 py-4 lg:grid-cols-12 lg:items-baseline lg:gap-x-6",
  infoRowFocusClassName,
);
const basicLabel = "text-small text-design-light-text-muted lg:col-span-3";
const basicValue = "text-design-light-text-primary lg:col-span-9";

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
      {/* 一、出处 + 人像 + 基本信息，合在第一屏（用户 2026-11-16）。
          之前第一屏是一句大标题加一段自我介绍（「把设计和前端结合起来…」），用户嫌它模版化、首页也已经说过；
          出处单独成段夹在资料和履历之间，位置尴尬。现在这一页开口就讲出处 —— 这是只有这一页才讲的东西。
          第一版只讲出处，用户说看不出「我」是谁 —— 所以大字先说人，出处退到小字里。
          信息的次序：竖排四个字（题签）→ 我是谁、从哪来（大字，h1）→ 现在做什么 → 出处（两段小字）。
          三栏：左 3 栏是名字，中间 5 栏是话，右 4 栏是人像。「墨分五色」四个字用系统自带的宋体竖排，
          全站只出现这一次（不加载网络字体，所以不用动 CSP）。
          这一屏只有人像那一处化开；出处原来配的那滴墨（origin-drop.tsx）没有再用 —— 一屏不放两处。
          至少一屏高：上半部分撑满，人像沉到底、站在基本信息顶上那道线上 */}
      <section className={cn("surface-base flex min-h-[100svh] flex-col bg-background pb-10 pt-28 sm:pb-14 sm:pt-36 lg:pb-10 lg:pt-28", edge)}>
        <p className="text-label uppercase text-design-light-text-muted">{about.eyebrow}</p>
        {/* 窄屏是同一套逻辑的两栏版：左边一条窄栏只放竖排的四个字（像书脊上的题签），右边一栏是内容 ——
            读音译名、那句话、小字、人像都在右栏，左缘对齐成一条线，人像正好占满右栏、站在线上。
            试过又否掉的（用户 2026-11-16）：四个字单独一行（右边空）、人像单独靠右（左边空）；
            以及把四个字挪到话的下面和人像并排（两样东西高低不齐，像硬凑在一起）。
            读音译名：宽屏在四个字下面，窄屏那一栏太窄放不下，改放在右栏顶上、紧挨着第一个字 */}
        <div className="mt-6 grid flex-1 grid-cols-[auto_1fr] items-end gap-x-5 gap-y-9 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0">
          <div className="flex flex-col gap-5 self-start lg:col-span-3">
            <p
              lang="zh"
              className="w-fit text-[clamp(2.75rem,6vw,6rem)] leading-[1.04] tracking-[0.06em] text-design-light-text-primary [font-family:'Songti_SC','Noto_Serif_SC','SimSun',serif] [writing-mode:vertical-rl]"
            >
              墨分五色
            </p>
            <p className="hidden max-w-[16ch] text-small text-design-light-text-muted lg:block">{about.origin.caption}</p>
          </div>
          <div className="self-start lg:col-span-5 lg:pr-4">
            <p className="mb-4 text-small text-design-light-text-muted lg:hidden">{about.origin.caption}</p>
            <h1 className="text-pretty font-display text-[clamp(1.7rem,3.3vw,3.25rem)] leading-[1.14] tracking-display text-design-light-text-primary">
              {about.intro.lead}
            </h1>
            {/* 两段小字：现在做什么（墨色）→ 出处（淡墨）。和首屏身份段一样，用墨的浓淡分主次 */}
            <p className="mt-6 max-w-[44ch] text-pretty text-[1.125rem] leading-snug text-design-light-text-primary sm:text-xl lg:mt-8">
              {about.intro.body}
            </p>
            <p className="mt-4 max-w-[44ch] text-pretty text-[1.125rem] leading-snug text-design-light-text-muted sm:text-xl lg:mt-5">
              {about.origin.body}
            </p>
          </div>
          {/* 人像：照片只在这一页出现一次。下缘不留空，直接压在下面那道线上。
              照片不反色（深色模式也是原样）—— 反色只给线稿 */}
          <div className="relative col-start-2 aspect-[4/5] w-full max-w-[26rem] lg:col-span-4 lg:col-start-auto lg:aspect-[5/6] lg:max-w-none">
            <PortraitInk />
            <Image
              src="/Profile_Yuwei.webp"
              alt={dictionary.common.portraitAlt}
              fill
              priority
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 26rem, 80vw"
              className="relative object-cover object-top"
            />
          </div>
        </div>

        {/* 分隔线都是墨线（ui/ink-rule.tsx），不是笔直的 border：人像站着的这一道是主线，行与行之间是淡的 */}
        <dl className={infoListClassName}>
          <InkRule />
          <div className={basicRow}>
            <dt className={basicLabel}>{about.roleLabel}</dt>
            <dd className={basicValue}>{SITE_ROLE}</dd>
          </div>
          <InkRule tone="soft" variant={1} />
          <div className={basicRow}>
            <dt className={basicLabel}>{about.locationLabel}</dt>
            <dd className={basicValue}>{SITE_LOCATIONS[locale]}</dd>
          </div>
          <InkRule tone="soft" variant={2} />
          <div className={basicRow}>
            <dt className={basicLabel}>{about.languagesLabel}</dt>
            <dd className={cn(basicValue, "flex flex-wrap gap-x-2 gap-y-1")}>
              {about.languages.map((lang, i) => (
                <span key={lang} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true" className="text-design-light-text-muted">·</span>}
                  {lang}
                </span>
              ))}
            </dd>
          </div>
          <InkRule tone="soft" variant={3} />
        </dl>
      </section>

      {/* 二、履历 + 能力（纸 2：和第一屏的纸交替） */}
      <section className={cn("surface-alt flex flex-col gap-20 bg-background py-section sm:gap-28 sm:py-section-sm", edge)}>
        <Block title={about.education} count={educations.length}>
          <ResumeList items={educations} emptyLabel={about.resumeEmpty} />
        </Block>
        <Block title={about.experience} count={experiences.length}>
          <ResumeList items={experiences} emptyLabel={about.resumeEmpty} />
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
