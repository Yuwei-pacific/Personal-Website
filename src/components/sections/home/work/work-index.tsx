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

export function WorkIndex({
  projects,
  offset,
  total,
  locale,
  title,
  countLabel,
}: {
  projects: Project[];
  /** 精选的个数：目录接着往下编号 */
  offset: number;
  total: number;
  locale: Locale;
  title: string;
  countLabel: string;
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
      <div className="mb-10 flex items-baseline justify-between">
        <h3 className="font-display text-section">{title}</h3>
        <p className="text-small text-design-light-text-muted">
          {total} {countLabel}
        </p>
      </div>
      {/* 墨线最后落在这里，成为目录顶上的那道线 */}
      <div data-ink="rule" className="h-px" />
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
