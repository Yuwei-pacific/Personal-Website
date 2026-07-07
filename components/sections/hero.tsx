// 首页 Hero 区：依赖的 Next.js 组件、图标与按钮
"use client";

import dynamic from "next/dynamic";
import { Link } from "next-view-transitions";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import DecryptedText from "@/components/DecryptedText";
import { useHeroAnimation } from "@/hooks/useHeroAnimation";
import { truncate } from "sanity/migrate";

// DotFieldImage 交互点阵背景（DotField 扩展版，支持按图片取色）：
// canvas 渲染，关闭 SSR（避免内部随机 SVG id 造成水合不匹配）；.jsx 组件显式标注 props 类型
type DotFieldImageProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  /** 取色图片：点阵颜色来自该图片对应位置的像素 */
  imageSrc?: string;
  imageFit?: "contain" | "cover";
  /** 图片透明/未覆盖区域的点的颜色 */
  fallbackColor?: string;
  className?: string;
  style?: React.CSSProperties;
};
const DotFieldImage = dynamic(() => import("@/components/DotFieldImage"), {
  ssr: false,
}) as ComponentType<DotFieldImageProps>;

// Hero 组件：首页主视觉区，包含标题、描述与 CTA 按钮
export function Hero() {
  const heroRef = useHeroAnimation<HTMLElement>();

  // 尊重"减弱动画"偏好：偏好开启时不渲染点阵（其 rAF 循环会持续运行）
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    // 全屏容器：相对定位，隔离层叠上下文，居中内容
    // 导航已改为 fixed 浮层不占文档流，hero 直接铺满整个视口
    <section ref={heroRef} id="home" className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden px-container-sm py-16 sm:px-10 md:px-16">
      {/* 背景装饰层：限制在 hero 内部，不影响主页后续区块 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* 渐变背景：保持冷白调，避免底部泛黄 */}
        <div className="absolute inset-0 bg-gradient-to-b from-design-hero-start via-design-hero-mid to-design-hero-end" />
        {/* 交互点阵背景：颜色取自棱镜图对应位置的像素，鼠标划过时产生排斥波纹
            （组件监听 window 事件，不受 pointer-events-none 影响） */}
        {!reducedMotion && (
          <DotFieldImage
            dotRadius={4}
            dotSpacing={6}
            bulgeStrength={32}
            glowRadius={0}
            sparkle={true}
            waveAmplitude={0}
            cursorRadius={500}
            cursorForce={0.5}
            bulgeOnly={true}
            imageSrc="/hero_mg.svg"
            imageFit="contain"
            fallbackColor="rgba(148, 163, 184, 0.25)"
            glowColor="#120F17"
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
