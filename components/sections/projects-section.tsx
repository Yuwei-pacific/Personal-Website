// 项目列表区：展示从 CMS 获取的项目卡片
import Image from "next/image";
import { ProjectCard } from "@/components/projects";
import type { Project } from "@/types";

type ProjectsSectionProps = {
  projects: Project[];
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  // 只显示 visibility 为 true 的项目
  const visibleProjects = projects.filter(project => project.visibility !== false);

  // 是否有可展示的项目
  const hasProjects = visibleProjects && visibleProjects.length > 0;

  // 按年份排序，最近的排在最前面
  const sortedProjects = [...visibleProjects].sort((a, b) => {
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    return yearB - yearA;
  });

  return (
    // 外层区块：深色背景，带滚动定位锚点 "work"
    <section
      id="work"
      className="w-full bg-design-dark-bg text-design-dark-text-primary relative z-10 scroll-mt-24"
      style={{ clipPath: "inset(0)" }}
    >
      {/* 背景装饰图形：使用 fixed 定位，并通过 clipPath 限制只在 work section 内部可见 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/hero_mg.svg"
          alt="Work background graphic"
          fill
          sizes="100vw"
          className="select-none object-contain object-center opacity-[0.22] blur-md"
          style={{
            animation: "hero-float 6s ease-in-out infinite alternate",
            willChange: "transform",
          }}
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-container pb-section pt-section sm:gap-gap-section sm:px-container-sm sm:pb-section-sm sm:pt-section-sm">
        {/* 顶部标题：与 Education / Experience 一致的大字加计数 */}
        <div className="flex items-baseline gap-1.5">
          <h2 className="text-3xl font-bold tracking-tight text-design-dark-text-primary sm:text-section">
            Work
          </h2>
          <sup className="text-small font-semibold text-design-dark-text-muted sm:text-body">
            ({sortedProjects.length})
          </sup>
        </div>

        {!hasProjects ? (
          /* 空状态提示：CMS 未发布时的占位 */
          <div className="mt-2 rounded-card border border-dashed border-design-dark-border bg-design-dark-surface/60 p-card text-small text-design-dark-text-secondary">
            Projects will appear here once they are published in Sanity.
          </div>
        ) : (
          /* 项目列表：单列编辑式大卡，图文左右交替 */
          <div className="mt-4 flex flex-col gap-6 sm:gap-8">
            {sortedProjects.map((project, idx) => {
              // 兼容 slug 为字符串或 { current } 对象的情况
              const slug =
                typeof project.slug === "string" ? project.slug : project.slug?.current;

              return (
                <ProjectCard
                  key={project._id || slug || `project-${idx}`}
                  project={project}
                  slug={slug}
                  revealDelay={idx === 0 ? 0 : 0.1}
                  reverse={idx % 2 === 1}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
