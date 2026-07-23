"use client";

// 单个项目卡片：编辑式图文交替大卡，支持无 slug 的静态卡片和有 slug 的可点击卡片
import { Link } from "next-view-transitions";
import { LuArrowUpRight } from "react-icons/lu";
import Image from "next/image";
import type { Project } from "@/lib/view-models/types";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { urlFor } from "@/sanity/image";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
    project: Project;
    slug?: string;
    /** 滚动入场动画的延迟（秒），用于在列表中制造错落感 */
    revealDelay?: number;
    /** 当前项目在列表中的位置，用于生成拼贴式宽度节奏 */
    index?: number;
};

// 拼贴节奏：8 个槽位一个循环，每行凑满 12 列（7+5 / 4+4+4 / 5+7 / 12），
// 任意项目数量收尾都是完整行或一段体面的留白。
// - ratio 用于按槽位比例请求 Sanity 裁切图（尊重编辑者标注的 hotspot）
// - sizes 按槽位实际占宽告知浏览器，避免下载过大的图
const layoutPattern = [
    { span: "md:col-span-7", aspect: "aspect-[16/10]", ratio: 16 / 10, sizes: "(min-width: 768px) 58vw, 100vw" },
    { span: "md:col-span-5", aspect: "aspect-[4/3]", ratio: 4 / 3, sizes: "(min-width: 768px) 42vw, 100vw" },
    { span: "md:col-span-4", aspect: "aspect-[4/3]", ratio: 4 / 3, sizes: "(min-width: 768px) 33vw, 100vw" },
    { span: "md:col-span-4", aspect: "aspect-[4/5]", ratio: 4 / 5, sizes: "(min-width: 768px) 33vw, 100vw" },
    { span: "md:col-span-4", aspect: "aspect-[4/3]", ratio: 4 / 3, sizes: "(min-width: 768px) 33vw, 100vw" },
    { span: "md:col-span-5", aspect: "aspect-[5/4]", ratio: 5 / 4, sizes: "(min-width: 768px) 42vw, 100vw" },
    { span: "md:col-span-7", aspect: "aspect-[16/9]", ratio: 16 / 9, sizes: "(min-width: 768px) 58vw, 100vw" },
    { span: "md:col-span-12", aspect: "aspect-[21/9]", ratio: 21 / 9, sizes: "100vw" },
];

// 裁切图请求宽度：足够覆盖最大槽位在 2x 屏上的显示宽度
const COVER_CROP_WIDTH = 1600;

export function ProjectCard({ project, slug, revealDelay = 0, index = 0 }: ProjectCardProps) {
    const meta = [project.projectType, project.year].filter(Boolean);
    const layout = layoutPattern[index % layoutPattern.length];

    // 按槽位比例生成 Sanity 裁切 URL：编辑者在 Studio 标注的 hotspot/crop 生效，
    // 竖槽裁横图时保住焦点，而不是从中心盲裁
    const coverSrc = project.coverImage?.asset
        ? urlFor(project.coverImage)
              .width(COVER_CROP_WIDTH)
              .height(Math.round(COVER_CROP_WIDTH / layout.ratio))
              .fit("crop")
              .auto("format")
              .url()
        : null;

    const cardContent = (
        <article className="group block">
            {/* 封面图：拼贴墙的主视觉块 */}
            <div className={cn(
                "relative overflow-hidden rounded-card border border-design-dark-border bg-design-dark-surface transition-[border-color,transform] duration-base ease-design-out group-hover:-translate-y-1 group-hover:border-design-dark-hover-border",
                layout.aspect
            )}>
                {coverSrc ? (
                    <Image
                        src={coverSrc}
                        alt={project.coverImage?.alt || project.title || "Project cover"}
                        fill
                        className="object-cover transition-transform duration-media ease-design-out group-hover:scale-[1.035]"
                        sizes={layout.sizes}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-design-dark-elevated to-design-dark-bg" />
                )}
                <div className="pointer-events-none absolute inset-0 bg-design-dark-bg/0 transition-colors duration-base group-hover:bg-design-dark-bg/10" />
                {slug && (
                    <span className="absolute right-3 top-3 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-full border border-design-dark-text-primary/40 bg-design-dark-bg/50 text-design-dark-text-primary opacity-0 backdrop-blur-md transition-[transform,opacity] duration-base group-hover:translate-y-0 group-hover:opacity-100">
                        <LuArrowUpRight className="h-4 w-4" />
                    </span>
                )}
            </div>

            {/* 贴边信息：参考作品索引式陈列，只保留最必要信息 */}
            <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <span className="pt-1 font-mono text-[0.65rem] leading-none text-design-dark-text-muted">
                    {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold leading-tight text-design-dark-text-primary sm:text-xl">
                    {project.title}
                </h3>
                {meta.length > 0 ? (
                    <p className="col-start-2 text-small leading-5 text-design-dark-text-muted">
                        {meta.join(" / ")}
                    </p>
                ) : (
                    <p className="col-start-2 text-small leading-5 text-design-dark-text-muted line-clamp-2">
                        {project.summary}
                    </p>
                )}
            </div>
        </article>
    );

    // 无 slug：返回静态不可点击卡片
    if (!slug) {
        return <ScrollReveal className={cn("block", layout.span)} delay={revealDelay}>{cardContent}</ScrollReveal>;
    }

    // 有 slug：外层 Link 包裹，跳转到项目详情页
    return (
        <ScrollReveal className={cn("block", layout.span)} delay={revealDelay}>
            <Link href={`/projects/${slug}`}>
                {cardContent}
            </Link>
        </ScrollReveal>
    );
}
