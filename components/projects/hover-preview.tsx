"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Project } from "./types";

interface HoverPreviewProps {
    project: Project;
}

export function HoverPreview({ project }: HoverPreviewProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // 获取所有项目卡片的链接
        const cardLinks = document.querySelectorAll('a[href*="/projects/"]');

        const handleMouseMove = (e: Event) => {
            if (!(e instanceof MouseEvent)) return;
            const x = e.clientX;
            const y = e.clientY;
            setPosition({ x, y });
        };

        const handleMouseEnter = (e: Event) => {
            if (!(e instanceof MouseEvent)) return;
            const link = e.currentTarget as HTMLElement;
            // 检查这个卡片是否对应当前项目
            if (link.getAttribute('href') === `/projects/${project.slug}`) {
                setIsVisible(true);
            }
        };

        const handleMouseLeave = (e: Event) => {
            if (!(e instanceof MouseEvent)) return;
            const link = e.currentTarget as HTMLElement;
            if (link.getAttribute('href') === `/projects/${project.slug}`) {
                setIsVisible(false);
            }
        };

        cardLinks.forEach((link) => {
            link.addEventListener('mousemove', handleMouseMove as EventListener);
            link.addEventListener('mouseenter', handleMouseEnter as EventListener);
            link.addEventListener('mouseleave', handleMouseLeave as EventListener);
        });

        return () => {
            cardLinks.forEach((link) => {
                link.removeEventListener('mousemove', handleMouseMove as EventListener);
                link.removeEventListener('mouseenter', handleMouseEnter as EventListener);
                link.removeEventListener('mouseleave', handleMouseLeave as EventListener);
            });
        };
    }, [project.slug]);

    // 如果没有封面图片或没有 slug，不显示预览
    if (!project.coverImage?.asset?.url || !project.slug) {
        return null;
    }

    return (
        <>
            {isVisible && (
                <div
                    className="fixed pointer-events-none z-50"
                    style={{
                        left: `${position.x + 20}px`,
                        top: `${position.y + 20}px`,
                    }}
                >
                    <div className="relative w-48 h-32 rounded-lg overflow-hidden shadow-2xl border border-neutral-700 bg-neutral-900 flex-shrink-0">
                        <Image
                            src={project.coverImage.asset.url}
                            alt={project.coverImage.alt || project.title}
                            fill
                            className="object-cover"
                            sizes="192px"
                            quality={80}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
