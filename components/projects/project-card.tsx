"use client";

// 单个项目卡片：支持无 slug 的静态卡片和有 slug 的可点击卡片
import { Link } from "next-view-transitions";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { Project } from "@/types";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useRef } from "react";
import gsap from "gsap";

type ProjectCardProps = {
    project: Project;
    slug?: string;
    /** 滚动入场动画的延迟（秒），用于在网格中制造错落感 */
    revealDelay?: number;
};

export function ProjectCard({ project, slug, revealDelay = 0 }: ProjectCardProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const tintRef = useRef<HTMLDivElement>(null);

    // 鼠标跟随光晕：直接写 DOM/CSS 变量，避免每次 mousemove 触发 React 重渲染
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = `${e.clientX - rect.left}px`;
        const y = `${e.clientY - rect.top}px`;
        gsap.set([glowRef.current, tintRef.current], { "--x": x, "--y": y });
    };

    const handleMouseEnter = () => {
        gsap.to([glowRef.current, tintRef.current], { autoAlpha: 1, duration: 0.5, ease: "power2.out" });
    };

    const handleMouseLeave = () => {
        gsap.to([glowRef.current, tintRef.current], { autoAlpha: 0, duration: 0.5, ease: "power2.out" });
    };

    // 卡片主体：带有鼠标跟随光晕效果，并使用封面图作为背景
    const cardContent = (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
        >
            {/* 项目封面作为背景 */}
            {project.coverImage?.asset?.url && (
                <div className="absolute inset-0 z-0">
                    <Image
                        src={project.coverImage.asset.url}
                        alt={project.coverImage.alt || project.title}
                        fill
                        className="object-cover opacity-20 grayscale transition-all duration-500 group-hover:opacity-40 group-hover:grayscale-0"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* 渐变遮罩层，确保深色模式下文本的可读性 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent" />
                </div>
            )}

            {/* 鼠标跟随的背景高光 */}
            <div
                ref={glowRef}
                className="pointer-events-none absolute inset-0 z-10 opacity-0"
                style={{
                    background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.06), transparent 40%)`,
                }}
            />
            {/* 鼠标跟随的彩色光晕 (Vercel 风格带有一点点色彩倾向) */}
            <div
                ref={tintRef}
                className="pointer-events-none absolute inset-0 z-10 opacity-0"
                style={{
                    background: `radial-gradient(400px circle at var(--x, 50%) var(--y, 50%), rgba(14, 165, 233, 0.08), transparent 40%)`,
                }}
            />

            <div className="relative z-20 flex flex-col gap-3 h-full justify-end min-h-[140px]">
                <div className="flex items-center gap-2">
                    {project.projectType && (
                        <span className="rounded-full border border-white/40 bg-white/90 px-3 py-1 text-xs font-semibold uppercase text-neutral-900 transition-colors group-hover:bg-white group-hover:border-white">
                            {project.projectType}
                        </span>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold text-white transition-colors">{project.title}</p>
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
                <div className="flex items-center justify-end gap-1.5 pt-2 text-sm font-semibold text-neutral-50">
                    <span className="transition-transform group-hover:translate-x-1">View project</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
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
