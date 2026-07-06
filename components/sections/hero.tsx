// 首页 Hero 区：依赖的 Next.js 组件、图标与按钮
"use client";

import Image from "next/image";
import { Link } from "next-view-transitions";

import { ArrowRight, Github, Linkedin, Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHeroAnimation } from "@/hooks/useHeroAnimation";

// Hero 组件：首页主视觉区，包含标题、描述、CTA 按钮与社交链接
export function Hero() {
  const heroRef = useHeroAnimation<HTMLElement>();
  return (
    // 全屏容器：相对定位，隔离层叠上下文，居中内容
    <section ref={heroRef} id="home" className="relative isolate flex min-h-screen w-full items-center overflow-hidden px-container-sm pb-28 pt-16 sm:px-10 md:px-16">
      {/* 背景装饰层：限制在 hero 内部，不影响主页后续区块 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* 渐变背景：保持冷白调，避免底部泛黄 */}
        <div className="absolute inset-0 bg-gradient-to-b from-design-hero-start via-design-hero-mid to-design-hero-end" />
        {/* 背景图形：半透明模糊 SVG，响应式定位；动画统一由 .hero-background 类控制，保证 prefers-reduced-motion 生效 */}
        <Image
          src="/hero_mg.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-background select-none object-contain object-center opacity-50 blur-md"
        />
      </div>

      {/* 主内容区：提升层级确保在背景之上，最大宽度限制 */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        {/* 文本内容：标题、副标题、描述与状态标签 */}
        <div className="space-y-4">
          {/* 顶部标签：Portfolio */}
          <p className="hero-label text-label font-semibold uppercase text-design-light-text-secondary">
            Portfolio
          </p>
          {/* 主标题：响应式字号，从 4xl 到 6xl */}
          <h1 className="hero-title text-balance text-4xl font-semibold leading-tight tracking-tight text-design-light-text-primary sm:text-display-sm lg:text-display">
            Creative Designer
          </h1>
          {/* 描述文案 */}
          <p className="hero-description max-w-2xl text-lg text-design-light-text-secondary sm:text-xl">
            I design and build vivid digital experiences
            <br />
            that bring color to the ordinary.
          </p>
          {/* 地点与状态标签 */}
          <div className="hero-status flex flex-wrap items-center gap-3 text-small text-design-light-text-secondary">
            <span className="font-medium text-design-light-text-primary">Based in Milan</span>
            <span className="inline-flex items-center gap-1 rounded-tag border border-design-light-border px-3 py-1 text-xs">
              Available for freelance
            </span>
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

      {/* 底部社交链接区：绝对定位，固定在视窗底部 */}
      <div className="absolute inset-x-0 bottom-8 z-20 w-full px-6 sm:bottom-10 sm:px-10 md:px-16">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-4">
            {/* "Get in touch" 标题与装饰箭头 */}
            <div className="flex items-center gap-3">
              <p className="whitespace-nowrap text-base font-semibold uppercase leading-[1.25] tracking-[0.2em] text-design-light-accent sm:text-2xl">
                Get in touch
              </p>
              <Image
                src="/arrow_1.svg"
                alt=""
                aria-hidden="true"
                width={29}
                height={22}
                className="h-[18px] w-auto sm:h-[22px]"
              />
            </div>
            <div className="h-px flex-1 bg-design-light-accent" />
            {/* 社交链接图标：GitHub、LinkedIn、Instagram */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="https://github.com/Yuwei-pacific"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="hero-social-icon inline-flex h-10 w-10 items-center justify-center rounded-full border border-design-light-accent/80 text-design-light-accent transition-colors duration-base hover:bg-design-light-accent hover:text-design-dark-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-design-light-accent"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/yuwei081/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hero-social-icon inline-flex h-10 w-10 items-center justify-center rounded-button border border-design-light-accent/80 text-design-light-accent transition-colors duration-base hover:bg-design-light-accent hover:text-design-dark-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-design-light-accent"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/yuwei081/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hero-social-icon inline-flex h-10 w-10 items-center justify-center rounded-full border border-design-light-accent/80 text-design-light-accent transition-colors duration-base hover:bg-design-light-accent hover:text-design-dark-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-design-light-accent"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
          {/* 邮箱地址 */}
          {/* <p className="text-small text-design-light-text-secondary sm:text-body">Find me via different Social Media Platforms</p> */}
        </div>
      </div>
    </section>
  );
}
