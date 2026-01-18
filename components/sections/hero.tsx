// 首页 Hero 区：依赖的 Next.js 组件、图标与按钮
"use client";

import Image from "next/image";
import Link from "next/link";

import { ArrowRight, Github, Linkedin, Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useScrollTriggerAnimation } from "@/hooks/useScrollTriggerAnimation";

// Hero 组件：首页主视觉区，包含标题、描述、CTA 按钮与社交链接
export function Hero() {
  useScrollTriggerAnimation();
  return (
    // 全屏容器：相对定位，隔离层叠上下文，居中内容
    <section className="relative isolate flex min-h-screen w-full items-center overflow-hidden px-6 py-16 sm:px-10 md:px-16">
      {/* 背景装饰层：固定定位，不阻塞交互，降低层级 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* 渐变背景：从浅蓝到浅黄 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0FBFF] via-[##FFFAFA] to-[#FFFFF2]" />
        {/* 背景图形：半透明模糊 SVG，响应式定位 */}
        <Image
          src="/hero_mg.svg"
          alt="Hero background graphic"
          fill
          priority
          sizes="100vw"
          className="hero-background select-none object-contain object-center sm:object-[50%_10%] opacity-50 blur-md"
        />
      </div>

      {/* 主内容区：提升层级确保在背景之上，最大宽度限制 */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        {/* 文本内容：标题、副标题、描述与状态标签 */}
        <div className="space-y-4">
          {/* 顶部标签：Portfolio */}
          <p className="hero-label text-sm font-semibold uppercase tracking-[0.3em] text-neutral-600">
            Portfolio
          </p>
          {/* 主标题：响应式字号，从 4xl 到 6xl */}
          <h1 className="hero-title text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Creative Designer
          </h1>
          {/* 描述文案 */}
          <p className="hero-description max-w-2xl text-lg text-neutral-700 sm:text-xl">
            I design and build vivid digital experiences.
            <br />
            that bring color to the ordinary.
          </p>
          {/* 地点与状态标签 */}
          <div className="hero-status flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">Based in Milan</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-xs">
              Available for freelance
            </span>
          </div>
        </div>

        {/* CTA 按钮组：查看作品与联系我 */}
        <div className="flex flex-wrap gap-3">
          <Button className="hero-cta gap-2" asChild>
            <Link href="#work">
              View work <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button className="hero-cta" variant="outline" asChild>
            <Link href="mailto:snowtime200801@gmail.com">Contact me Via mail</Link>
          </Button>
        </div>
      </div>

      {/* 底部社交链接区：绝对定位，固定在视窗底部 */}
      <div className="absolute inset-x-0 bottom-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-4">
            {/* "Get in touch" 标题与装饰箭头 */}
            <div className="flex items-center gap-3">
              <p className="text-xl font-semibold uppercase tracking-[0.2em] text-neutral-900 sm:text-2xl">
                Get in touch
              </p>
              <Image
                src="/arrow_1.svg"
                alt="Directional arrow"
                width={29}
                height={22}
                className="h-[18px] w-auto sm:h-[22px]"
              />
            </div>
            {/* 分隔线：flex-1 自动填充剩余空间 */}
            {/* 分隔线：flex-1 自动填充剩余空间 */}
            <div className="h-px flex-1 bg-neutral-900" />
            {/* 社交链接图标：GitHub、LinkedIn、Instagram */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="https://github.com/Yuwei-pacific"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="hero-social-icon inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900/80 text-neutral-900 transition hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/yuwei081/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hero-social-icon inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-neutral-900/80 text-neutral-900 transition hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/yuwei081/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hero-social-icon inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900/80 text-neutral-900 transition hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
          {/* 邮箱地址 */}
          <p className="text-sm text-neutral-700 sm:text-base">Mail: snowtime200801@gmail.com</p>
        </div>
      </div>
    </section>
  );
}
