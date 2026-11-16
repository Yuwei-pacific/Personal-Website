"use client";

// 目录：精选之外的项目，一行一个。墨线最后落在目录顶上（data-ink="rule"），成为那道线。
// 悬停（或键盘聚焦）某一行时，旁边落下一小滩墨显出这个项目的封面（IndexPreview）。
// 触屏没有悬停：md 以下不出预览，点一行直接进详情页。
import { useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { Link } from "next-view-transitions";

import { localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import { buildCropUrl } from "@/lib/media";
import type { Project } from "@/lib/view-models/types";

import { IndexPreview, PREVIEW_HEIGHT, PREVIEW_WIDTH, type PreviewItem } from "./index-preview";
import { InkFigure } from "./ink-figure";

export function WorkIndex({
  projects,
  offset,
  locale,
  title,
}: {
  projects: Project[];
  /** 精选的个数：目录接着往下编号 */
  offset: number;
  locale: Locale;
  title: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [top, setTop] = useState(0);

  const items: PreviewItem[] = projects.map((project) => ({
    id: project._id,
    image: project.coverImage
      ? buildCropUrl(project.coverImage, {
          width: PREVIEW_WIDTH * 2,
          height: PREVIEW_HEIGHT * 2,
          animated: project.coverImage.animated,
        })
      : null,
    video: project.coverVideo?.url ?? null,
  }));

  const show = (index: number, event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const list = listRef.current?.getBoundingClientRect();
    const row = event.currentTarget.getBoundingClientRect();
    if (list) setTop(row.top - list.top + row.height / 2);
    setActive(index);
  };

  return (
    <div className="mt-[clamp(8rem,20vw,16rem)]">
      {/* 不在这里再写一次项目总数：总数已经在 Work 标题旁边，这里只列精选之外的几个，
          写「5 个项目」而底下只有两行，数字和看到的对不上。行号接着精选往下编，已经说明了顺序 */}
      <h3 className="mb-10 font-display text-section">{title}</h3>
      {/* 墨线最后落在这里，成为目录顶上的那道线 */}
      <div data-ink="rule" className="relative h-px">
        {/* 「托腮」的小人趴在目录这根线上，像在挑下一个（用户定稿的位置：线长的 62.5% 处，手肘压过线） */}
        {/* 手机上线短，小人按线长的比例会小得看不清：放大到线长的四分之一 */}
        <InkFigure
          figure="lean"
          className="left-[60%] w-[25%] md:left-[62.45%] md:w-[12.93%]"
          style={{ top: 0, transform: "translateY(-76.4%)" }}
        />
      </div>
      <ul ref={listRef} className="relative" onMouseLeave={() => setActive(null)}>
        <IndexPreview item={active === null ? null : items[active]} top={top} />
        {projects.map((project, i) => {
          const row = (
            <>
              <span aria-hidden="true" className="col-span-2 font-display text-lg italic text-design-light-text-muted md:col-span-1">
                {String(offset + i + 1).padStart(2, "0")}
              </span>
              <span className="col-span-10 font-display text-[clamp(1.5rem,2.2vw,2rem)] leading-tight transition-transform duration-base ease-design-out group-hover:translate-x-2 group-focus-visible:translate-x-2 motion-reduce:transition-none md:col-span-4">
                {project.title}
              </span>
              <span className="col-span-10 col-start-3 mt-1 text-small text-design-light-text-secondary md:col-span-5 md:col-start-auto md:mt-0">
                {project.projectType}
              </span>
              <span className="hidden text-small text-design-light-text-muted md:col-span-1 md:block">{project.year}</span>
              <span aria-hidden="true" className="hidden text-right md:col-span-1 md:block">
                →
              </span>
            </>
          );
          const className =
            "group grid grid-cols-12 items-baseline gap-x-6 border-b border-design-light-border py-5";
          return (
            <li key={project._id}>
              {project.slug ? (
                <Link
                  href={localizedPath(locale, `/projects/${project.slug}`)}
                  onMouseEnter={(event) => show(i, event)}
                  onFocus={(event) => show(i, event)}
                  onBlur={() => setActive(null)}
                  className={`${className} touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4`}
                >
                  {row}
                </Link>
              ) : (
                <div className={className}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
