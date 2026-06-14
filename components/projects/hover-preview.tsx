"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import type { Project } from "@/types";

type ProjectHoverPreviewLayerProps = {
    projects: Project[];
    children: ReactNode;
};

// 项目网格的悬浮预览层：用单个事件委托替代每张卡片各自的全局监听器，
// 避免 N 个项目挂载 N 套重复的 document 级 mousemove 监听
export function ProjectHoverPreviewLayer({ projects, children }: ProjectHoverPreviewLayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia("(hover: none)").matches);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) return;

        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e: MouseEvent) => {
            const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/projects/"]');
            if (link) {
                setHoveredSlug(link.getAttribute("href")?.replace("/projects/", "") ?? null);
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/projects/"]');
            const related = e.relatedTarget as Node | null;
            if (link && !(related && link.contains(related))) {
                setHoveredSlug(null);
            }
        };

        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseover", handleMouseOver);
        container.addEventListener("mouseout", handleMouseOut);

        return () => {
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mouseover", handleMouseOver);
            container.removeEventListener("mouseout", handleMouseOut);
        };
    }, [isMobile]);

    const hoveredProject = projects.find((project) => {
        const slug = typeof project.slug === "string" ? project.slug : project.slug?.current;
        return slug === hoveredSlug;
    });

    return (
        <div ref={containerRef} className="relative">
            {children}

            {!isMobile && hoveredProject?.coverImage?.asset?.url && (
                <div
                    className="fixed pointer-events-none z-50"
                    style={{
                        left: `${position.x + 20}px`,
                        top: `${position.y + 20}px`,
                    }}
                >
                    <div className="relative w-48 h-32 rounded-lg overflow-hidden shadow-2xl border border-neutral-700 bg-neutral-900 flex-shrink-0">
                        <Image
                            src={hoveredProject.coverImage.asset.url}
                            alt={hoveredProject.coverImage.alt || hoveredProject.title}
                            fill
                            className="object-cover"
                            sizes="192px"
                            quality={80}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
