"use client";

// 一个精选作品：封面占位 + 旁边的文字。封面本身由 WorkInk 画在墨滩里，占位里的 <img> 平时透明，
// 只有三种时候露出来：
// - 读屏：它就是封面的替代文字；
// - 不支持 WebGL：区块被标成 data-ink="off"，它变成可见的普通封面（焦点之外黑白）；
// - 点击时：它顶到最上面，作为「封面共享过渡」的起点，变形到详情页的封面（见 cover-transition.tsx）。
// 它也是 WorkInk 上传成纹理的那张图（带 crossOrigin），不会重复下载。
import { useRef } from "react";
import { Link } from "next-view-transitions";

import { claimCoverTransition } from "@/components/projects/cover-transition";
import { localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";
import { buildCropUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/view-models/types";

import { InkFigure } from "./ink-figure";

// 精选的三种位置，按顺序循环：左右交错，各项之间留大段空白给墨线（样稿里定下的列位）。
// 不导出：这是客户端组件文件，服务端组件从这里拿到的普通值只是一个客户端引用（undefined）
// 手机上封面左右各收进 1rem，墨滩外扩也收小（POOL_PAD_MOBILE）：整滩墨连同它的晕都落在屏幕里面。
// 手机上墨线走文字旁边的页边距、左右交替（ink-geometry.ts 的 mobileThread）：
// 第奇数个作品的文字在右边让出 3rem，第偶数个在左边让出 3rem
const LAYOUTS = [
  { cover: "md:col-start-2 md:col-span-5", text: "md:col-start-8 md:col-span-4" },
  { cover: "md:col-start-7 md:col-span-5 md:row-start-1", text: "md:col-start-2 md:col-span-4 md:row-start-1" },
  { cover: "md:col-start-3 md:col-span-5", text: "md:col-start-9 md:col-span-4" },
] as const;

// 纹理用的封面：16:10 裁切（尊重 Studio 里标的焦点），墨滩按 object-fit: cover 铺满
const COVER_WIDTH = 1600;
const COVER_HEIGHT = 1000;

export function FeaturedWork({
  project,
  position,
  locale,
}: {
  project: Project;
  /** 从 1 起的编号，也决定这一项用哪种位置 */
  position: number;
  locale: Locale;
}) {
  const layout = LAYOUTS[(position - 1) % LAYOUTS.length];
  const imageRef = useRef<HTMLImageElement>(null);
  const cover = project.coverImage
    ? buildCropUrl(project.coverImage, { width: COVER_WIDTH, height: COVER_HEIGHT, animated: project.coverImage.animated })
    : null;
  // 角色比类型更能说明「我在里面做了什么」；没填角色时退回类型
  const meta = [project.roles.length ? project.roles.join(" · ") : project.projectType, project.year]
    .filter(Boolean)
    .join(" — ");

  const content = (
    <>
      <div data-ink="cover" data-id={project._id} className={cn("group/cover relative mx-4 aspect-[16/10] md:mx-0", layout.cover)}>
        {cover ? (
          // 不用 next/image：这张图要以 CORS 方式取回、原样上传成 WebGL 纹理
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imageRef}
            src={cover}
            alt={project.coverImage?.alt ?? ""}
            crossOrigin="anonymous"
            decoding="async"
            data-cover-transition
            className="absolute inset-0 size-full object-cover opacity-0 grayscale transition-[filter,opacity] duration-slow ease-design-out group-data-[focused=true]/cover:grayscale-0 group-data-[ink=off]/work:opacity-100 motion-reduce:transition-none"
          />
        ) : null}
        {/* 第二个精选的墨滩上沿坐着「对着电脑」的小人（用户定稿：跟着第二个精选，不绑定具体项目）。
            位置按设计稿换算成封面占位的比例：左 39.6%、宽 37.25%，脚下比封面上沿低一点点（墨滩外扩的那圈） */}
        {position === 2 ? (
          <InkFigure figure="laptop" style={{ left: "39.6%", width: "37.25%", top: 0, transform: "translateY(-94%)" }} />
        ) : null}
      </div>
      <div className={cn(position % 2 === 1 ? "pr-12" : "pl-12", "md:px-0", layout.text)}>
        <p aria-hidden="true" className="font-display text-2xl italic text-design-light-text-muted">
          {String(position).padStart(2, "0")}
        </p>
        <h3 className="mt-2 font-display text-[clamp(2.25rem,3.8vw,3.75rem)] leading-none tracking-display">
          {project.title}
        </h3>
        {project.summary ? (
          <p className="mt-5 max-w-[36ch] text-body text-design-light-text-secondary">{project.summary}</p>
        ) : null}
        {meta ? <p className="mt-5 text-small text-design-light-text-muted">{meta}</p> : null}
      </div>
    </>
  );

  const className = "grid grid-cols-1 items-center gap-y-12 md:grid-cols-12 md:gap-x-6";

  if (!project.slug) return <div className={className}>{content}</div>;

  return (
    <Link
      href={localizedPath(locale, `/projects/${project.slug}`)}
      onClick={() => {
        const image = imageRef.current;
        if (image) {
          // 过渡的起点要是彩色、可见的封面（它平时透明，焦点之外还是黑白）
          image.style.opacity = "1";
          image.style.filter = "none";
        }
        claimCoverTransition(image);
      }}
      className={cn(
        className,
        "touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-8",
      )}
    >
      {content}
    </Link>
  );
}
