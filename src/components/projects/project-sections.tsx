// 项目正文：按顺序渲染内容模块，每种模块一套排版。
// 模块之间的间距统一在这里控制，模块自身不带外边距——
// 这样新增模块类型时不用重新协调上下间隔。
import type { ProjectSection } from "@/lib/view-models/types";

import { ProjectRichText } from "./project-rich-text";
import { SectionMedia } from "./section-media";

// 文字模块铺满外层内容容器（详情页的 max-w-content），与迁移前的正文宽度一致。
// 若日后想收窄到更利于阅读的字数/行，改这一处即可（例如 mx-auto max-w-3xl）。
const TEXT_COLUMN = "w-full";

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-6 text-2xl font-semibold leading-tight text-design-dark-text-primary sm:text-3xl">
      {children}
    </h2>
  );
}

function Section({ section, index }: { section: ProjectSection; index: number }) {
  // 首个模块的媒体参与首屏，交给 Next 优先加载
  const priority = index === 0;

  switch (section.kind) {
    case "richText":
      return (
        <div className={TEXT_COLUMN}>
          {section.heading && <SectionHeading>{section.heading}</SectionHeading>}
          <div className="text-design-dark-text-secondary">
            <ProjectRichText blocks={section.content} />
          </div>
        </div>
      );

    case "quote":
      return (
        <figure className={TEXT_COLUMN}>
          <blockquote className="border-l-2 border-design-dark-border-strong pl-6 text-xl font-medium leading-relaxed text-design-dark-text-primary sm:text-2xl">
            {section.quote}
          </blockquote>
          {section.attribution && (
            <figcaption className="mt-4 pl-6 text-small text-design-dark-text-muted">
              — {section.attribution}
            </figcaption>
          )}
        </figure>
      );

    case "mediaText":
      return (
        <div className="w-full">
          {section.heading && (
            <div className={TEXT_COLUMN}>
              <SectionHeading>{section.heading}</SectionHeading>
            </div>
          )}
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className={section.mediaPosition === "right" ? "md:order-2" : "md:order-1"}>
              <SectionMedia
                media={section.media}
                priority={priority}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
            <div
              className={`text-design-dark-text-secondary ${
                section.mediaPosition === "right" ? "md:order-1" : "md:order-2"
              }`}
            >
              <ProjectRichText blocks={section.content} />
            </div>
          </div>
        </div>
      );

    case "media":
      return section.fullWidth ? (
        <div className="w-full">
          <SectionMedia media={section.media} priority={priority} sizes="100vw" />
        </div>
      ) : (
        // 非全宽：收窄并居中，与铺满容器的全宽模块形成对比
        <div className="mx-auto w-full max-w-4xl">
          <SectionMedia
            media={section.media}
            priority={priority}
            sizes="(min-width: 896px) 896px, 100vw"
          />
        </div>
      );

    case "mediaGroup":
      return (
        <div className="w-full">
          <div
            className={`grid gap-4 sm:gap-6 ${
              section.items.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
            }`}
          >
            {section.items.map((item) => (
              <SectionMedia
                key={item.key}
                media={item}
                sizes={
                  section.items.length === 2
                    ? "(min-width: 640px) 50vw, 100vw"
                    : "(min-width: 640px) 33vw, 100vw"
                }
              />
            ))}
          </div>
          {section.caption && (
            <p className="mt-3 text-small leading-5 text-design-dark-text-muted">
              {section.caption}
            </p>
          )}
        </div>
      );
  }
}

export function ProjectSections({ sections }: { sections: ProjectSection[] }) {
  if (!sections.length) return null;

  return (
    <div className="flex w-full flex-col gap-16 sm:gap-24">
      {sections.map((section, index) => (
        <Section key={section.key} section={section} index={index} />
      ))}
    </div>
  );
}
