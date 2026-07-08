// 项目列表区：展示从 CMS 获取的项目卡片
import Image from "next/image";
import { ProjectCard } from "@/components/projects";
import type { Project } from "@/types";

type ProjectsSectionProps = {
  projects: Project[];
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  // 可见性过滤与年份排序都在 GROQ 里完成（见 sanity/lib/queries.ts），这里直接渲染
  const hasProjects = projects.length > 0;

  return (
    // 外层区块：深色背景，带滚动定位锚点 "work"
    <section
      id="work"
      // data-overscroll-dark：告知 OverscrollBackground 本区块为深色，
      // 区块在视口内时 body 背景切深色（只在过界回弹时可见）
      data-overscroll-dark
      className="w-full bg-design-dark-bg text-design-dark-text-primary relative z-10 scroll-mt-24"
      style={{ clipPath: "inset(0)" }}
    >
      {/* 背景装饰图形：使用 fixed 定位，并通过 clipPath 限制只在 work section 内部可见；
          动画统一由 .hero-background 类控制，保证 prefers-reduced-motion 生效 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/hero_mg.svg"
          alt=""
          fill
          sizes="100vw"
          className="hero-background select-none object-contain object-center opacity-[0.22] blur-md"
        />
      </div>

      <div className="flex w-full flex-col gap-6 pb-section pt-section sm:gap-gap-section sm:pb-section-sm sm:pt-section-sm">
        {/* 顶部标题：与 Education / Experience 一致的大字加计数 */}
        <div className="mx-auto flex w-full max-w-6xl items-baseline gap-1.5 px-container sm:px-container-sm">
          <h2 className="text-3xl font-bold tracking-tight text-design-dark-text-primary sm:text-section">
            Work
          </h2>
          <sup className="text-small font-semibold text-design-dark-text-muted sm:text-body">
            ({projects.length})
          </sup>
        </div>

        {!hasProjects ? (
          /* 空状态提示：CMS 未发布时的占位 */
          <div className="mx-auto mt-2 w-full max-w-6xl rounded-card border border-dashed border-design-dark-border bg-design-dark-surface/60 p-card text-small text-design-dark-text-secondary">
            Projects will appear here once they are published in Sanity.
          </div>
        ) : (
          /* 项目列表：拼贴式项目墙，使用不同跨列宽度制造节奏 */
          <div className="mt-4 grid w-full grid-cols-1 gap-x-3 gap-y-14 px-container sm:gap-x-4 sm:gap-y-20 sm:px-container-sm md:grid-cols-12 lg:px-8">
            {projects.map((project, idx) => (
              <ProjectCard
                key={project._id}
                project={project}
                slug={project.slug ?? undefined}
                revealDelay={idx === 0 ? 0 : 0.1}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
