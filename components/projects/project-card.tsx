// 单个项目卡片：支持无 slug 的静态卡片和有 slug 的可点击卡片
import Link from "next/link";
import type { Project } from "./types";
import { HoverPreview } from "./hover-preview";

type ProjectCardProps = {
    project: Project;
    slug?: string;
};

export function ProjectCard({ project, slug }: ProjectCardProps) {
    // 卡片主体：渐变光晕背景，包含类型标签、标题/年份、摘要与箭头
    const cardContent = (
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:p-6">
            <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute -top-16 right-0 h-40 w-40 rotate-12 bg-gradient-to-br from-sky-500/30 via-emerald-400/20 to-purple-500/20 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    {project.projectType && (
                        <span className="rounded-full border border-white/40 bg-white/90 px-3 py-1 text-xs font-semibold uppercase text-neutral-900 ">
                            {project.projectType}
                        </span>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold text-white">{project.title}</p>
                        {project.year && (
                            <span className="rounded-full border border-neutral-800 bg-neutral-800/80 px-3 py-1 text-xs font-medium text-neutral-100">
                                {project.year}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-neutral-300">
                        {project.summary || project.description}
                    </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 text-sm font-semibold text-neutral-50">
                    <span className="transition-transform group-hover:translate-x-1">View project</span>
                    <span aria-hidden className="text-lg transition-transform group-hover:translate-x-1">↗</span>
                </div>
            </div>
        </div>
    );

    // 无 slug：返回静态不可点击卡片
    if (!slug) {
        return <div className="scroll-animate">{cardContent}</div>;
    }

    // 有 slug：外层 Link 包裹，跳转到项目详情页
    return (
        <>
            <HoverPreview project={project} />
            <Link
                href={`/projects/${slug}`}
                className="scroll-animate block"
            >
                {cardContent}
            </Link>
        </>
    );
}
