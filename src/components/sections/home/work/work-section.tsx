// 首页 Work 区（设计：docs/superpowers/specs/2026-11-15-work-section-design.md）。
//
//   Work (5)
//                    ╭─ 墨线从区块顶部流进来
//   ┌─墨滩─────┐     │      01 标题 / 简介 / 角色 — 年份
//   │  封面    │─────╯
//   └──────────┘╮
//               ╰────────╮    ┌─墨滩─────┐
//   02 标题 …             ╰───│  封面    │
//                             └──────────┘
//   Index ───────────────────────────────────── 墨线落成目录顶线
//   04  Impass.online   类型   2025   →      （悬停：旁边落下一小滩墨，显出封面）
//
// 这一层只排版、摆占位：封面占位 data-ink="cover"、目录顶线 data-ink="rule"。
// 墨滩、墨线、封面图像都由 WorkInk 画在一块铺满区块的化开画布上；一次只化开离视口中线
// 最近的那个精选（彩色、带五色晕、播视频），其余收成墨边、封面黑白。
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Project } from "@/lib/view-models/types";

import { FeaturedWork } from "./featured-work";
import { WorkIndex } from "./work-index";
import { WorkInk } from "./work-ink";

export function WorkSection({
  featured,
  index,
  locale,
  dictionary,
}: {
  featured: Project[];
  index: Project[];
  locale: Locale;
  dictionary: Dictionary;
}) {
  const copy = dictionary.home.projects;
  const total = featured.length + index.length;

  return (
    // group/work：不支持 WebGL 时 WorkInk 会给区块加 data-ink="off"，占位里的封面据此改为可见
    <section id="work" className="group/work relative isolate w-full scroll-mt-24 overflow-clip text-design-light-text-primary">
      {total > 0 ? (
        <WorkInk featured={featured.map((project) => ({ id: project._id, video: project.coverVideo?.url ?? null }))} />
      ) : null}

      <div className="relative px-edge py-section sm:px-edge-sm sm:py-section-sm">
        <h2
          aria-label={`${copy.title}, ${total} ${copy.countLabel}`}
          className="font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.9] tracking-display"
        >
          {copy.title}
          <sup aria-hidden="true" className="ml-2 align-super font-sans text-small tracking-normal text-design-light-text-muted">
            ({total})
          </sup>
        </h2>

        {total === 0 ? (
          <p className="mt-10 max-w-content text-body text-design-light-text-secondary">{copy.empty}</p>
        ) : null}

        {featured.length > 0 ? (
          <div className="mt-20 flex flex-col gap-28 md:mt-28 md:gap-[clamp(10rem,22vw,18rem)]">
            {featured.map((project, i) => (
              <FeaturedWork
                key={project._id}
                project={project}
                position={i + 1}
                locale={locale}
              />
            ))}
          </div>
        ) : null}

        {index.length > 0 ? (
          <WorkIndex
            projects={index}
            offset={featured.length}
            locale={locale}
            title={copy.index}
          />
        ) : null}
      </div>
    </section>
  );
}
