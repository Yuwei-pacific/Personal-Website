"use client";

// 单个项目卡片：编辑式图文交替大卡，支持无 slug 的静态卡片和有 slug 的可点击卡片
import { Link } from "next-view-transitions";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { Project } from "@/types";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
    project: Project;
    slug?: string;
    /** 滚动入场动画的延迟（秒），用于在列表中制造错落感 */
    revealDelay?: number;
    /** 是否反转图文顺序（用于交替布局） */
    reverse?: boolean;
};

export function ProjectCard({ project, slug, revealDelay = 0, reverse = false }: ProjectCardProps) {
    const meta = [project.projectType, project.year].filter(Boolean);

    const cardContent = (
        <div className="group grid grid-cols-1 overflow-hidden rounded-card border border-design-dark-border bg-design-dark-surface transition-colors duration-base hover:border-design-dark-hover-border sm:grid-cols-2">
            {/* 封面图：占一半宽度，hover 时缓慢放大 */}
            <div className={cn("relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-[220px]", reverse && "sm:order-2")}>
                {project.coverImage?.asset?.url ? (
                    <Image
                        src={project.coverImage.asset.url}
                        alt={project.coverImage.alt || project.title}
                        fill
                        className="object-cover transition-transform duration-media ease-design-out group-hover:scale-hover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-design-dark-elevated to-design-dark-bg" />
                )}
            </div>

            {/* 文字区：标题、元信息、摘要、CTA */}
            <div className="flex flex-col justify-center gap-3 p-5 sm:p-6 lg:p-8">
                {meta.length > 0 && (
                    <div className="flex items-center gap-3 text-label font-semibold uppercase text-design-dark-text-muted">
                        {meta.map((item, i) => (
                            <span key={item} className="flex items-center gap-3">
                                {i > 0 && <span className="text-design-dark-border-strong">/</span>}
                                {item}
                            </span>
                        ))}
                    </div>
                )}
                <h3 className="text-xl font-semibold leading-tight text-design-dark-text-primary sm:text-2xl">
                    {project.title}
                </h3>
                <p className="text-small leading-6 text-design-dark-text-muted line-clamp-3">
                    {project.summary || project.description}
                </p>
                {slug && (
                    <span className="inline-flex items-center gap-2 text-small font-semibold text-design-dark-text-primary">
                        View project
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-base group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </span>
                )}
            </div>
        </div>
    );

    // 无 slug：返回静态不可点击卡片
    if (!slug) {
        return <ScrollReveal delay={revealDelay}>{cardContent}</ScrollReveal>;
    }

    // 有 slug：外层 Link 包裹，跳转到项目详情页
    return (
        <ScrollReveal className="block" delay={revealDelay}>
            <Link href={`/projects/${slug}`}>
                {cardContent}
            </Link>
        </ScrollReveal>
    );
}
