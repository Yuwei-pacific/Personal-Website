"use client";

// 单个项目卡片：编辑式图文交替大卡，支持无 slug 的静态卡片和有 slug 的可点击卡片
import { useRef } from "react";
import { Link } from "next-view-transitions";
import { LuArrowUpRight } from "react-icons/lu";
import { SanityImage } from "@/components/ui/sanity-image";
import type { Project } from "@/lib/view-models/types";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { buildCropUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

type ProjectCardProps = {
    project: Project;
    slug?: string;
    /** 滚动入场动画的延迟（秒），用于在列表中制造错落感 */
    revealDelay?: number;
    /** 当前项目在列表中的位置，用于生成拼贴式宽度节奏 */
    index?: number;
    /** 列表里的项目总数：排版按行规划，收尾方式取决于总数 */
    total?: number;
    locale: Locale;
    dictionary: Dictionary;
};

// 拼贴节奏：按「行」编排，而不是按固定槽位循环。
// - 成对的行（7+4 / 4+7）故意只占 11 列：空出的一列是版面留白，不是没填满。
//   每对的第二张用 start 跳过那一列，再用 drop 下沉一段，打破顶部对齐。
//   两张的序号都放大后落进空列（gutterIndex）：第一张的贴在自己右侧，
//   第二张的贴在自己左侧并随卡片下沉，一上一下错开。
// - 三等分那一行三张同为 4:3 —— 等宽列里混用高度只会让标题基线错开，
//   读起来像没对齐而不是错落。
// - ratio 用于按槽位比例请求 Sanity 裁切图（尊重编辑者标注的 hotspot）
// - sizes 按槽位实际占宽告知浏览器，避免下载过大的图
// start / drop / gutterIndex 都只在 md 起生效，单列的手机布局不受影响。
type LayoutSlot = {
    span: string;
    start?: string;
    drop?: string;
    /** 大序号落在卡片哪一侧的空列里；不设则用卡片下方的小序号 */
    gutterIndex?: "before" | "after";
    aspect: string;
    ratio: number;
    sizes: string;
};

const WIDE_SIZES = "(min-width: 768px) 58vw, 100vw";
const NARROW_SIZES = "(min-width: 768px) 33vw, 100vw";

const third: LayoutSlot = { span: "md:col-span-4", aspect: "aspect-[4/3]", ratio: 4 / 3, sizes: NARROW_SIZES };

const rows = {
    // 大左 + 小右（下沉）
    pairWideFirst: [
        { span: "md:col-span-7", gutterIndex: "after", aspect: "aspect-[16/10]", ratio: 16 / 10, sizes: WIDE_SIZES },
        { span: "md:col-span-4", start: "md:col-start-9", drop: "md:mt-24", gutterIndex: "before", aspect: "aspect-[4/3]", ratio: 4 / 3, sizes: NARROW_SIZES },
    ],
    // 小左 + 大右（下沉）：上一对的镜像
    pairWideLast: [
        { span: "md:col-span-4", gutterIndex: "after", aspect: "aspect-[5/4]", ratio: 5 / 4, sizes: NARROW_SIZES },
        { span: "md:col-span-7", start: "md:col-start-6", drop: "md:mt-24", gutterIndex: "before", aspect: "aspect-[16/9]", ratio: 16 / 9, sizes: WIDE_SIZES },
    ],
    thirds: [third, third, third],
    full: [{ span: "md:col-span-12", aspect: "aspect-[21/9]", ratio: 21 / 9, sizes: "100vw" }],
    // 收尾落单的一张：靠右的宽幅，左侧四列留白放它的大序号
    solo: [
        { span: "md:col-span-8", start: "md:col-start-5", gutterIndex: "before", aspect: "aspect-[16/9]", ratio: 16 / 9, sizes: "(min-width: 768px) 66vw, 100vw" },
    ],
} satisfies Record<string, LayoutSlot[]>;

// 行的循环顺序：两对镜像的错位行打头，再用一行三等分和一行通栏换气
const ROW_CYCLE: LayoutSlot[][] = [rows.pairWideFirst, rows.pairWideLast, rows.thirds, rows.full];

// 按项目总数排出每个位置的槽位。循环到末尾凑不满一行时不硬套下一行：
// 剩 2 张排成一对（与上一对镜像），剩 1 张用 solo —— 任何数量都以完整的行收尾。
function planLayout(total: number): LayoutSlot[] {
    const slots: LayoutSlot[] = [];
    let pairCount = 0;

    for (let rowIndex = 0; slots.length < total; rowIndex += 1) {
        const remaining = total - slots.length;
        let row = ROW_CYCLE[rowIndex % ROW_CYCLE.length];

        if (remaining < row.length) {
            if (remaining === 1) {
                row = rows.solo;
            } else {
                row = pairCount % 2 === 0 ? rows.pairWideFirst : rows.pairWideLast;
            }
        }
        if (row.length === 2) pairCount += 1;
        slots.push(...row);
    }

    return slots;
}

// 裁切图请求宽度：足够覆盖最大槽位在 2x 屏上的显示宽度
const COVER_CROP_WIDTH = 1600;

export function ProjectCard({
    project,
    slug,
    revealDelay = 0,
    index = 0,
    total = index + 1,
    locale,
    dictionary,
}: ProjectCardProps) {
    const meta = [project.projectType, project.year].filter(Boolean);
    const layout = planLayout(total)[index];
    const indexLabel = String(index + 1).padStart(2, "0");
    // 槽位的列宽、起始列与下沉都落在 ScrollReveal 这层 grid item 上
    const slotClassName = cn("block", layout.span, layout.start, layout.drop);

    // 按槽位比例生成 Sanity 裁切 URL：编辑者在 Studio 标注的 hotspot/crop 生效，
    // 竖槽裁横图时保住焦点，而不是从中心盲裁。
    // 动图（GIF）跳过 auto=format，否则只会剩第一帧（见 lib/media.ts）
    const coverSrc = project.coverImage?.asset
        ? buildCropUrl(project.coverImage, {
              width: COVER_CROP_WIDTH,
              height: Math.round(COVER_CROP_WIDTH / layout.ratio),
              animated: project.coverImage.animated,
          })
        : null;

    // 可选封面视频：默认显示封面图，hover 时才静音循环播放。
    // preload="none" 保证列表初次加载不下载任何视频，只有真的 hover 了才拉流；
    // 视频的 poster 用同一张裁切图，避免缓冲期间闪出黑块
    const reducedMotion = usePrefersReducedMotion();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hoverVideo = reducedMotion ? null : project.coverVideo;

    const playHoverVideo = () => {
        // play() 在自动播放策略下可能 reject，静默忽略即可
        videoRef.current?.play().catch(() => {});
    };

    const resetHoverVideo = () => {
        const video = videoRef.current;
        if (!video) return;
        video.pause();
        video.currentTime = 0;
    };

    const cardContent = (
        <article
            className="group relative block"
            onMouseEnter={hoverVideo ? playHoverVideo : undefined}
            onMouseLeave={hoverVideo ? resetHoverVideo : undefined}
        >
            {/* 空列里的大序号：只在 md 起、且槽位留了空列时出现，取代卡片下方的小序号。
                before 贴在卡片左侧，after 贴在右侧 */}
            {layout.gutterIndex && (
                <span
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute top-0 hidden font-mono text-[clamp(1.5rem,3.6vw,3.5rem)] font-medium leading-[0.85] tracking-display text-design-dark-text-muted md:block",
                        layout.gutterIndex === "before" ? "right-full mr-3 lg:mr-4" : "left-full ml-3 lg:ml-4"
                    )}
                >
                    {indexLabel}
                </span>
            )}
            {/* 封面图：拼贴墙的主视觉块 */}
            <div className={cn(
                "relative overflow-hidden border border-design-dark-border bg-design-dark-surface transition-transform duration-base ease-design-out group-hover:-translate-y-1",
                layout.aspect
            )}>
                {coverSrc ? (
                    <SanityImage
                        src={coverSrc}
                        alt={
                            project.coverImage?.alt ||
                            project.title ||
                            dictionary.project.projectCover
                        }
                        fill
                        className="object-cover transition-transform duration-media ease-design-out group-hover:scale-[1.035]"
                        sizes={layout.sizes}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-design-dark-elevated to-design-dark-bg" />
                )}
                {hoverVideo && (
                    <video
                        ref={videoRef}
                        src={hoverVideo.url}
                        poster={coverSrc ?? undefined}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-hidden
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-base group-hover:opacity-100"
                    />
                )}
                <div className="pointer-events-none absolute inset-0 bg-design-dark-bg/0 transition-colors duration-base group-hover:bg-design-dark-bg/10" />
                {slug && (
                    <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-design-dark-text-primary/40 bg-design-dark-bg/50 text-design-dark-text-primary opacity-100 backdrop-blur-md transition-[transform,opacity] duration-base md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                        <LuArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                )}
            </div>

            {/* 贴边信息：参考作品索引式陈列，只保留最必要信息 */}
            <div className={cn("mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1", layout.gutterIndex && "md:grid-cols-1")}>
                <span className={cn("pt-1 font-mono text-xs leading-none text-design-dark-text-muted", layout.gutterIndex && "md:hidden")}>
                    {indexLabel}
                </span>
                <h3 className="text-lg font-semibold leading-tight text-design-dark-text-primary sm:text-xl">
                    {project.title}
                </h3>
                {meta.length > 0 ? (
                    <p className={cn("col-start-2 text-small leading-5 text-design-dark-text-muted", layout.gutterIndex && "md:col-start-1")}>
                        {meta.join(" / ")}
                    </p>
                ) : (
                    <p className={cn("col-start-2 text-small leading-5 text-design-dark-text-muted line-clamp-2", layout.gutterIndex && "md:col-start-1")}>
                        {project.summary}
                    </p>
                )}
            </div>
        </article>
    );

    // 无 slug：返回静态不可点击卡片
    if (!slug) {
        return <ScrollReveal className={slotClassName} delay={revealDelay}>{cardContent}</ScrollReveal>;
    }

    // 有 slug：外层 Link 包裹，跳转到项目详情页
    return (
        <ScrollReveal className={slotClassName} delay={revealDelay}>
            <Link
                href={localizedPath(locale, `/projects/${slug}`)}
                className="block touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-4 focus-visible:ring-offset-design-dark-bg"
            >
                {cardContent}
            </Link>
        </ScrollReveal>
    );
}
