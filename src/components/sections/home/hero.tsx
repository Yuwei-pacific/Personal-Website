// 首页首屏：口号 + 从标志里流出来的墨线 + 身份段，右侧是化开的 L·i 标志。
// 版式来自用户在 Figma 里排定的第二版（1440×900 画板），换算成视口比例：
//
//   ┌──────────────────────────────────────────────┐
//   │ Bring color to the                  ▄▄  ▲    │  口号：Fraunces，color 化开
//   │ ordinary.                           █  ███   │
//   │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━█━━███   │  墨线：从页面左缘一直流进标志里
//   │ Yuwei Li is a communication …       ████▄▄   │  身份段：前半句墨色、后半句淡墨
//   │ Get in touch →                               │
//   │                     ( ↓ )                    │  Scroll Down 徽章，半截压在底边外
//   └──────────────────────────────────────────────┘
//
// 一屏里有三处化开（标志、墨线、color 一词），是品牌手册「一个画面只化开一处」的唯一例外：
// 三者是同一滴墨 —— 墨线从标志流出来，color 是这句话里被染到的那个词。
//
// 标志和墨线画在同一块铺满首屏的画布上（HeroInk），排版里只放两个占位：InkMarkSlot（墨迹框）
// 和 InkLineSlot（墨线所在的那一行）。墨线右端流进「i」的竖笔，两者的晕连成一片。
//
// 入场（不减弱动画时）：水落在标志上，漫开时顺着墨线往左流出去（HeroInk 自带的显影），
// color 一词同样显影；口号先浮现，最后是身份段和联系方式。
"use client";

import { useRef } from "react";

import { HeroInk, InkLineSlot, InkMarkSlot, InkWord } from "@/components/ui/ink-mark";
import { ScrollBadge } from "@/components/ui/scroll-badge";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/gsap-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { SITE_EMAIL } from "@/lib/site-metadata";

// 标志的尺寸与位置（CSS 变量，下面几处都要用）：
// --mark-h  墨迹高度：Figma 里 662/900 ≈ 73.5svh；窄而高的屏幕上再按宽度收（46vw），免得压到口号
//           —— 1440×900 下两者相等，所以 Figma 的尺寸原样保留
// --mark-w  墨迹宽度：按墨迹框 196×228 的比例
// --mark-r  墨迹右缘到视口右缘的距离：Figma 里 19/1440 ≈ 1.3vw
const MARK_VARS =
  "[--mark-h:min(73.5svh,46vw)] [--mark-w:calc(var(--mark-h)*196/228)] [--mark-r:1.3vw]";

export function Hero({ dictionary }: { dictionary: Dictionary }) {
  const hero = dictionary.home.hero;
  const { before, accent, after, end } = hero.slogan;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.set(".hero-slogan", { autoAlpha: 0, y: 24 });
      gsap.set(".hero-details", { autoAlpha: 0, y: 16 });

      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .to(".hero-slogan", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.15)
        .to(".hero-details", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 }, 1.9);
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      id="home"
      className={`relative isolate flex h-[100svh] min-h-[36rem] w-full flex-col overflow-hidden bg-background px-edge sm:px-edge-sm ${MARK_VARS}`}
    >
      {/* 化开的标志和墨线：一块画布铺满首屏，压在文字下面 */}
      <HeroInk className="absolute inset-0" />

      {/* 标志的占位：lg 起贴右、垂直居中，与口号同排。
          lg 以下（含平板竖屏）标志和口号排不下同一行，就不显示标志（用户的决定：挤到口号上方只会占掉
          一大块空间，显影前那里还是空的）。墨线保留，作为口号和信息之间的分隔 */}
      <InkMarkSlot
        className="absolute right-[var(--mark-r)] top-1/2 hidden h-[var(--mark-h)] w-[var(--mark-w)] -translate-y-1/2 lg:block"
        label="L·i"
      />

      <div className="relative flex flex-1 flex-col justify-center pb-24 pt-28 md:pb-20">
        <h1 className="hero-slogan max-w-[12ch] font-display text-[clamp(2.75rem,min(7.3vw,11.7svh),8rem)] leading-[0.98] tracking-display text-design-light-text-primary">
          {before}
          {/* 化开的词按行内元素排进句子，基线对齐；视觉上是 SVG，读屏读这份真实文字 */}
          <span className="sr-only">{accent}</span>
          <InkWord word={accent} className="ml-[0.04em] inline-block h-[1.02em] w-auto align-[-0.06em]" />
          {after}
          {/* 第二行从 end 起；手机上一行放不下「Bring color to the」，强制换行会让 the 单独成行，
              所以窄屏不强制，让句子自然折成两行 */}
          <br className="hidden sm:inline" /> {end}
        </h1>

        {/* 墨线这一行：线画在它的竖向中线上，左端贴视口左缘、右端流进标志的「i」。
            行高要装得下两侧的晕，晕才不会压到口号和身份段上。宽度只给 SVG 兜底用 */}
        <InkLineSlot className="-ml-edge h-[clamp(5.5rem,14svh,8.5rem)] w-[100vw] sm:-ml-edge-sm lg:w-[calc(100vw-var(--mark-r)-var(--mark-w)*0.56)]" />

        {/* 宽度不超过标志左缘（留 3rem），中等宽度的屏幕上身份段不会钻到标志底下 */}
        <p className="hero-details max-w-[46ch] text-pretty lg:max-w-[min(46ch,calc(100vw-var(--mark-r)-var(--mark-w)-6rem))] text-[1.25rem] leading-snug sm:text-2xl">
          <span className="text-design-light-text-primary">{hero.identity.lead}</span>
          <span className="text-design-light-text-muted">{hero.identity.rest}</span>
        </p>
        <a
          href={`mailto:${SITE_EMAIL}`}
          className="hero-details mt-8 inline-flex min-h-11 w-fit touch-manipulation items-center border-b-2 border-accent text-xl leading-[1.3] tracking-[-0.02em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:min-h-0 sm:text-2xl"
        >
          {hero.cta}
        </a>
      </div>

      {/* Scroll Down：底部居中，下半截压在首屏底边外（Figma 里 52/84 露出） */}
      <ScrollBadge
        href="#work"
        label={hero.scrollDown}
        className="absolute bottom-0 left-1/2 z-20 size-[84px] -translate-x-1/2 translate-y-[38%]"
      />
    </section>
  );
}
