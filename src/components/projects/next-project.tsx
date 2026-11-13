"use client";

// 详情页结尾的「下一个项目」：整块可点，页面不再以死路收尾。
// 顺序沿用首页列表（GROQ 里排好），由 fetchNextProject 取出。
import { useRef } from "react";
import { Link } from "next-view-transitions";

import { SanityImage } from "@/components/ui/sanity-image";
import { buildScaledUrl } from "@/lib/media";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import type { Project } from "@/lib/view-models/types";

import { claimCoverTransition } from "./cover-transition";

export function NextProject({
  project,
  position,
  label,
  locale,
}: {
  project: Project;
  /** 在项目列表里的序号（从 1 起），与首页 Work 的编号一致 */
  position: number;
  label: string;
  locale: Locale;
}) {
  const coverRef = useRef<HTMLDivElement>(null);
  if (!project.slug) return null;

  const coverUrl = project.coverImage?.asset?.url;
  const meta = [project.projectType, project.year].filter(Boolean);

  return (
    <Link
      data-overscroll-dark
      href={localizedPath(locale, `/projects/${project.slug}`)}
      onClick={() => claimCoverTransition(coverRef.current)}
      className="group block border-t border-design-dark-border-strong bg-design-dark-bg px-edge py-panel text-design-dark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-design-dark-text-primary sm:px-edge-sm sm:py-panel-sm"
    >
      <div className="grid grid-cols-1 items-end gap-x-4 gap-y-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="flex items-baseline gap-3 font-mono text-small text-design-dark-text-muted">
            <span>{label}</span>
            <span aria-hidden="true">{String(position).padStart(2, "0")}</span>
          </p>
          {/* 箭头用不换行空格拴在标题最后一个词上，避免单独掉到下一行 */}
          <p className="mt-4 text-[11vw] font-semibold leading-[0.95] tracking-display sm:text-[clamp(3rem,7vw,6.5rem)]">
            {project.title}
            {" "}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-slow ease-design-out group-hover:translate-x-[0.15em] motion-reduce:transition-none"
            >
              →
            </span>
          </p>
          {meta.length ? (
            <p className="mt-5 text-small text-design-dark-text-muted">{meta.join(" / ")}</p>
          ) : null}
        </div>

        {coverUrl ? (
          <div
            ref={coverRef}
            data-cover-transition
            className="relative aspect-[16/10] overflow-hidden bg-design-dark-surface md:col-span-4 md:col-start-9"
          >
            <SanityImage
              src={buildScaledUrl(coverUrl, {
                width: 1200,
                animated: project.coverImage?.animated ?? false,
              })}
              // 装饰性：链接的可读名称已由标题提供
              alt=""
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-media ease-design-out group-hover:scale-[1.04] motion-reduce:transition-none"
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
