// 项目列表区：展示从 CMS 获取的项目卡片
import Link from "next/link";
import { ProjectCard } from "../projects/project-card";
import type { Project } from "../projects/types";

type ProjectsSectionProps = {
  projects: Project[];
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  // 是否有可展示的项目
  const hasProjects = projects && projects.length > 0;

  return (
    // 外层区块：深色背景，带滚动定位锚点 "work"
    <section
      id="work"
      className="w-full bg-neutral-950 px-4 pb-14 pt-14 text-white sm:px-6 sm:pb-20 sm:pt-20 scroll-mt-24"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-10">
        {/* 顶部标题与说明 */}
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-300">
            Work
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Selected work across design and build.
              </h2>
              <p className="max-w-3xl text-base text-neutral-200 sm:text-lg">
                Interfaces, systems, and interaction stories that ship.
              </p>
            </div>
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-xs font-medium text-neutral-100 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Available for collaborations
            </div> */}
          </div>
        </header>

        {!hasProjects ? (
          /* 空状态提示：CMS 未发布时的占位 */
          <div className="mt-2 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/60 p-6 text-sm text-neutral-200">
            Projects will appear here once they are published in Sanity.
          </div>
        ) : (
          /* 项目网格：响应式两列起步 */
          <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2">
            {projects.map((project, idx) => {
              // 兼容 slug 为字符串或 { current } 对象的情况
              const slug =
                typeof project.slug === "string" ? project.slug : project.slug?.current;

              return (
                <ProjectCard
                  key={project._id || slug || `project-${idx}`}
                  project={project}
                  slug={slug}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
