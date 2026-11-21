"use client";

// 详情页结尾的「下一个项目」：整块可点，页面不再以死路收尾。
// 顺序沿用首页列表（GROQ 里排好），由 fetchNextProject 取出。
import { useRef, useState } from "react";
import { Link } from "next-view-transitions";

import { buildCropUrl } from "@/lib/media";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import type { Project } from "@/lib/view-models/types";

import { InkCover } from "./ink-cover";
import { useInkNavigate } from "./ink-transition";

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
  const inkNavigate = useInkNavigate();
  // 缩略图平时收拢成一圈墨边、黑白；指到这一块（或键盘聚焦）才化开、上色 —— 常亮的彩边会和标题抢。
  // 触屏没有悬停：手指划过不算（否则滚动时一闪一闪），那里一直是收拢的，点下去由过场接上
  const [active, setActive] = useState(false);
  if (!project.slug) return null;
  const href = localizedPath(locale, `/projects/${project.slug}`);

  // 和首页精选同一个裁切、同一个地址：从首页来的人这张图已经在缓存里
  const coverUrl = project.coverImage
    ? buildCropUrl(project.coverImage, { width: 1600, height: 1000, animated: project.coverImage.animated })
    : null;
  const meta = [project.projectType, project.year].filter(Boolean);

  return (
    <Link
      data-overscroll-dark
      href={href}
      // 过场：墨从缩略图那一小滩漫开（见 ink-transition.tsx）
      onClick={(event) => inkNavigate(event, href, coverRef.current)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setActive(true);
      }}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className="group block bg-design-dark-bg px-edge py-panel text-design-dark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-design-dark-text-primary sm:px-edge-sm sm:py-panel-sm"
    >
      <div className="grid grid-cols-1 items-end gap-x-4 gap-y-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="flex items-baseline gap-3 font-mono text-small text-design-dark-text-muted">
            <span>{label}</span>
            <span aria-hidden="true">{String(position).padStart(2, "0")}</span>
          </p>
          {/* 箭头用不换行空格拴在标题最后一个词上，避免单独掉到下一行 */}
          <p className="mt-4 font-display text-[11vw] leading-[0.95] tracking-display sm:text-[clamp(3rem,7vw,6.5rem)]">
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

        {/* 缩略图是一小滩墨（ink-cover.tsx），和首页目录悬停时落下的那滩是同一个东西；不播视频 */}
        {coverUrl ? (
          <div ref={coverRef} className="mx-4 md:col-span-4 md:col-start-9 md:mx-0">
            {/* 装饰性：链接的可读名称已由标题提供 */}
            <InkCover id={project._id} image={coverUrl} alt="" focused={active} className="aspect-[16/10] w-full" />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
