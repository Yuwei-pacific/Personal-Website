// 首页首屏：口号 + 流进标志的墨线 + 身份段，右侧是化开的雨标志（品牌手册 11）。
//
//   ┌──────────────────────────────────────────────┐
//   │ Bring color to the                           │  口号：Fraunces，color 化开，ordinary 斜体
//   │ ordinary.                                    │
//   │━━━━━━━━━━━━━━━━━━━━━━━━━━━━▄▄▄████████████▄  │  墨线：从页面左缘流进顶上那一横的左端，
//   │ Yuwei Li is a communication …  ▄█▀▀ █ ▀▀█▄   │        像同一笔写出来的
//   │ Get in touch →                 █ ◜◝ █ ◜◝ █   │  身份段：前半句墨色、后半句淡墨
//   │                                █    █    █   │  标志挂在线下面
//   └──────────────────────────────────────────────┘
//
// 一屏里有三处化开（标志、墨线、color 一词），是品牌手册「一个画面只化开一处」的唯一例外：
// 三者是同一滴墨 —— 墨线把它们连起来，color 是这句话里被染到的那个词。
//
// 整屏挂在一条横线上：墨线。口号坐在线上面，身份段和标志挂在线下面 —— 标志顶上那一横就是这条线的尽头，
// 所以标志的位置由线定，不再自己垂直居中（旧标志 L·i 是线流进半腰的斜竖）。
//
// 标志和墨线画在同一块铺满首屏的画布上（HeroInk），排版里只放两个占位：InkMarkSlot（墨迹的外框）
// 和 InkLineSlot（墨线所在的那一行）。
//
// 入场（不减弱动画时）：水落在标志上，漫开时顺着墨线往左流出去（HeroInk 自带的显影），
// color 一词同样显影；口号先浮现，最后是身份段和联系方式。
"use client";

import { useRef } from "react";

import { HeroInk, InkLineSlot, InkMarkSlot, InkWord } from "@/components/ui/ink-mark";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/gsap-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { textLink } from "@/components/ui/text-link";
import { SITE_AUTHOR, SITE_EMAIL } from "@/lib/site-metadata";

// 首屏的尺寸与位置（CSS 变量，下面几处都要用）。这几个数是用户在调参面板里拖出来的（2026-11-25）：
// 墨线 42.5svh、标志 52svh（上限 36vw）、右缘 1.75rem、窄屏标志 240px；线尾的两个数在 ui/ink-mark.tsx。lg 起：
// --line-y    墨线离首屏顶边多远。口号的底贴着它上面，标志和身份段从它往下挂
// --line-row  墨线那一行的高度：要装得下两侧的晕，晕才不会压到口号和身份段上
// --mark-h    标志的高度；--mark-w 按墨迹外框的比例（接近正方形）
//             线以下要装得下整个标志：line-y + mark-h 不超过首屏的高度
// --mark-r    标志右缘到视口右缘：比页边（2rem）略靠外，晕的外沿才和 Menu 按钮那条竖线齐
// lg 以下：标志和线排在口号上面，--mark-hm 是那里标志的高度。化开的标志最小 240 px（手册 02）：
//           手机上就取这个下限，平板（md）有地方，跟着屏高放大
const HERO_VARS =
  "[--line-y:max(42.5svh,17rem)] [--line-row:clamp(4.5rem,11svh,7rem)] [--mark-h:min(52svh,36vw)] [--mark-w:calc(var(--mark-h)*0.9933)] [--mark-r:1.75rem] [--mark-hm:15rem] md:[--mark-hm:clamp(15rem,34svh,24rem)]";
// 那一横的中线离标志上缘：高度的 5.4%（ink-tables.ts 的 MARK_BAR.y）
const BAR_Y = 0.054;

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
      className={`relative isolate z-20 flex min-h-[max(100svh,36rem)] w-full flex-col lg:h-[100svh] lg:min-h-[36rem] overflow-x-clip bg-background px-edge sm:px-edge-sm ${HERO_VARS}`}
    >
      {/* 化开的标志和墨线：一块画布铺满首屏，压在文字下面 */}
      <HeroInk className="absolute inset-0" />

      {/* 标志的占位：lg 起贴右页边，顶上那一横的中线落在墨线上，整个字挂在线下面。
          lg 以下（含平板竖屏）用下面口号上方那一套 */}
      <InkMarkSlot
        className="absolute right-[var(--mark-r)] hidden h-[var(--mark-h)] w-[var(--mark-w)] lg:block"
        style={{ top: `calc(var(--line-y) - var(--mark-h) * ${BAR_Y})` }}
        label={SITE_AUTHOR}
      />

      <div className="relative flex flex-1 flex-col justify-center pb-16 pt-24 md:pb-20 lg:block lg:py-0">
        {/* lg 以下：标志和墨线排在口号上面 —— 线从屏幕左缘流进右边标志顶上那一横，和宽屏是同一个构图。
            更早的窄屏没有标志，线是口号和介绍之间一条通体发光的粗带，晕压着上下的字（用户 2026-11-16）。
            --mark-hm：窄屏标志的高度 */}
        <div className="relative mb-7 h-[var(--mark-hm)] lg:hidden">
          <InkLineSlot
            className="absolute -left-edge h-10 w-[100vw] -translate-y-1/2 sm:-left-edge-sm"
            style={{ top: `${BAR_Y * 100}%` }}
          />
          <InkMarkSlot
            className="absolute right-0 top-0 h-full w-[calc(var(--mark-hm)*0.9933)]"
            label={SITE_AUTHOR}
          />
        </div>
        {/* lg 起：口号的底贴在墨线那一行上面。这一层的高度 = 墨线以上的全部 */}
        <div className="lg:flex lg:h-[calc(var(--line-y)-var(--line-row)/2)] lg:flex-col lg:justify-end">
          <h1 className="hero-slogan max-w-[12ch] font-display text-[clamp(2.75rem,min(7.3vw,11.7svh),8rem)] leading-[0.98] tracking-display text-design-light-text-primary">
            {before}
            {/* 化开的词按行内元素排进句子，基线对齐；视觉上是画布，读屏读这份真实文字 */}
            <span className="sr-only">{accent}</span>
            <InkWord word={accent} className="ml-[0.04em] inline-block h-[1.02em] w-auto align-[-0.06em]" />
            {after}
            {/* 第二行从 end 起；手机上一行放不下「Bring color to the」，强制换行会让 the 单独成行，
                所以窄屏不强制，让句子自然折成两行。
                斜体只给这一个词（手册 06）：口号里的 ordinary / ordinario */}
            <br className="hidden sm:inline" /> <em className="italic">{end}</em>
          </h1>
        </div>

        {/* 墨线这一行：线画在它的竖向中线上，左端贴视口左缘、右端流进标志顶上那一横。宽度只给 SVG 兜底用 */}
        <InkLineSlot className="-ml-edge hidden h-[var(--line-row)] w-[100vw] sm:-ml-edge-sm lg:block lg:w-[calc(100vw-var(--mark-r)-var(--mark-w)*0.8)]" />

        {/* 宽度不超过标志左缘（留 3rem），中等宽度的屏幕上身份段不会钻到标志底下 */}
        <p className="hero-details mt-6 max-w-[46ch] text-pretty lg:mt-0 lg:max-w-[min(46ch,calc(100vw-var(--mark-r)-var(--mark-w)-6rem))] text-[1.25rem] leading-snug sm:text-2xl">
          <span className="text-design-light-text-primary">{hero.identity.lead}</span>
          <span className="text-design-light-text-muted">{hero.identity.rest}</span>
        </p>
        {/* 联系方式和「接项目」并排：访客在第一屏就知道可以来找我做事。
            这一屏已经有东西化开，不再放 Coral 的圆点（手册 03），所以只是一行淡墨小字 */}
        <div className="hero-details mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <a href={`mailto:${SITE_EMAIL}`} className={textLink("lg")}>
            {hero.cta}
          </a>
          <p className="text-small text-design-light-text-muted">{hero.availability}</p>
        </div>
      </div>

      {/* 底部不放 Scroll Down 徽章：居中旋转的圆章是全页唯一居中、唯一在转的东西，正卡在首屏和 About 的接缝上 */}
    </section>
  );
}
