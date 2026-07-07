// 首页 Hero 区：依赖的 Next.js 组件、图标与按钮
"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { Link } from "next-view-transitions";
import type { ComponentType, ReactNode } from "react";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import DecryptedText from "@/components/DecryptedText";
import { useHeroAnimation } from "@/hooks/useHeroAnimation";

// GridMotion 渲染期读取 window，必须关闭 SSR 仅在客户端加载；
// .jsx 源码的 items 默认值 [] 会被 TS 推断成 never[]，这里显式标注 props 类型
type GridMotionProps = {
  items?: (string | ReactNode)[];
  gradientColor?: string;
};
const GridMotion = dynamic(() => import("@/components/GridMotion"), {
  ssr: false,
}) as ComponentType<GridMotionProps>;

// GridMotion 网格固定 4 行 × 7 列
const GRID_ITEM_COUNT = 28;

type HeroProps = {
  /** 项目封面图 URL 列表，用于背景动态网格 */
  backgroundImages?: string[];
};

// Hero 组件：首页主视觉区，包含标题、描述、CTA 按钮与社交链接
export function Hero({ backgroundImages = [] }: HeroProps) {
  const heroRef = useHeroAnimation<HTMLElement>();

  // 将项目封面图循环填满 28 格；带上 Sanity CDN 压缩参数控制加载体积
  const gridItems = backgroundImages.length
    ? Array.from(
        { length: GRID_ITEM_COUNT },
        (_, i) => `${backgroundImages[i % backgroundImages.length]}?w=800&q=60&auto=format`
      )
    : [];

  return (
    // 全屏容器：相对定位，隔离层叠上下文，居中内容
    // 导航已改为 fixed 浮层不占文档流，hero 直接铺满整个视口
    <section ref={heroRef} id="home" className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden px-container-sm py-16 sm:px-10 md:px-16">
      {/* 背景装饰层：限制在 hero 内部，不影响主页后续区块 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* 渐变背景：保持冷白调，避免底部泛黄 */}
        <div className="absolute inset-0 bg-gradient-to-b from-design-hero-start via-design-hero-mid to-design-hero-end" />
        {gridItems.length ? (
          <>
            {/* 项目封面动态网格：跟随鼠标横向漂移（GridMotion 监听 window 事件，不受 pointer-events-none 影响） */}
            <GridMotion items={gridItems} gradientColor="white" />
            {/* 亮色蒙版：压暗网格存在感，保证前景深色文字可读（z-10 盖过 GridMotion 内部 z-index:2 的网格层） */}
            <div className="absolute inset-0 z-10 bg-design-light-bg/80" />
          </>
        ) : (
          /* 无项目图片时回退到原棱镜背景 */
          <Image
            src="/hero_mg.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-background select-none object-contain object-center opacity-50 blur-md"
          />
        )}
      </div>

      {/* 主内容区：全宽布局，与底部 Get in touch 通栏对齐 */}
      <div className="relative z-10 flex w-full flex-col gap-8">
        {/* 文本内容：标签与超大两行标题（与下方区块的编辑式排版呼应） */}
        <div className="space-y-5">
          {/* 顶部标签：Portfolio，与 About me 标签同款式 */}
          <p className="hero-label text-label font-semibold uppercase text-design-light-text-secondary">
            Portfolio
          </p>
          {/* 主标题：整页最大的排版时刻，两行堆叠 */}
          <h1 className="hero-title text-[3.25rem] font-semibold leading-[0.95] tracking-tight text-design-light-text-primary sm:text-7xl lg:text-[7.5rem]">
            Creative
            <br />
            Designer
          </h1>
        </div>

        {/* 细分隔线 + 描述/状态行：复用 About 区行表语言（细线、圆点分隔符） */}
        <div className="border-t border-design-light-border pt-6">
          <div className="flex flex-col gap-5">
            {/* 描述句：全宽展开，进入视口时逐字“解密”，只触发一次 */}
            <p className="hero-description text-pretty text-xl leading-relaxed text-design-light-text-secondary sm:text-2xl lg:text-3xl">
              <DecryptedText
                text="I design and build vivid digital experiences that bring color to the ordinary."
                animateOn="view"
                sequential
                revealDirection="start"
                speed={30}
                encryptedClassName="text-design-light-text-muted/50"
              />
            </p>
          </div>
        </div>

        {/* CTA 按钮组：查看作品与联系我 */}
        <div className="flex flex-wrap gap-3">
          <Button className="hero-cta gap-2 transition-transform duration-base hover:scale-emphasis" asChild>
            <Link href="#work">
              View work <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button className="hero-cta transition-transform duration-base hover:scale-emphasis" variant="outline" asChild>
            <Link href="mailto:snowtime200801@gmail.com">Contact Me via Email</Link>
          </Button>
        </div>
      </div>

    </section>
  );
}
