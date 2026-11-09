// 首页 Hero 区：依赖的交互点阵与入场动画
"use client";

import dynamic from "next/dynamic";

import DecryptedText from "@/components/vendor/DecryptedText";
import { useHeroAnimation } from "@/hooks/use-hero-animation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Dictionary } from "@/i18n/dictionaries";
import { SITE_EMAIL, SITE_ROLE } from "@/lib/site-metadata";

// Hero 点阵取色图的 art direction：横屏用全景棱镜图，竖屏用竖版构图
const HERO_IMAGE_LANDSCAPE = "/hero_mg.svg";
const HERO_IMAGE_PORTRAIT = "/hero_mg_portrait.svg";
// DotFieldImage 交互点阵背景（DotField 扩展版，支持按图片取色）：
// canvas 渲染，关闭 SSR（避免内部随机 SVG id 造成水合不匹配）；
// props 类型来自 vendor 目录的 .d.ts 声明
const DotFieldImage = dynamic(() => import("@/components/vendor/DotFieldImage"), {
  ssr: false,
});

// Hero 组件：首页主视觉区，包含角色标题、定位文案与联系入口
function EmphasizedDescription({ text, terms }: { text: string; terms: string[] }) {
  const escapedTerms = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escapedTerms.join("|")})`, "g"));

  return parts.map((part, index) =>
    terms.includes(part) ? (
      <strong key={`${part}-${index}`} className="font-bold">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

export function Hero({ dictionary }: { dictionary: Dictionary }) {
  const heroRef = useHeroAnimation<HTMLElement>();
  const hero = dictionary.home.hero;

  // 尊重"减弱动画"偏好：偏好开启时不渲染点阵（其 rAF 循环会持续运行）
  const reducedMotion = usePrefersReducedMotion();

  // 按容器比例倾向选取色图（art direction）：比 orientation 更适合 iPad 分屏和横屏手机边界
  const isTallViewport = useMediaQuery("(max-aspect-ratio: 4/5)");
  const heroImage = isTallViewport ? HERO_IMAGE_PORTRAIT : HERO_IMAGE_LANDSCAPE;

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative isolate flex h-[100svh] w-full flex-col overflow-hidden bg-background"
    >
      {/* 底部信息区按内容占高；点阵区自动填满 100svh 中剩余的全部空间。 */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* 交互点阵背景：颜色取自棱镜图对应位置的像素，鼠标划过时产生排斥波纹
              （组件监听 window 事件，不受 pointer-events-none 影响） */}
          {!reducedMotion && (
            <DotFieldImage
              dotRadius={4}
              dotSpacing={6}
              // 点数预算：整屏重绘的开销主要按点数增长。实测（M 系列 Mac，@2x）
              // 2560px 宽约 3.2 万点、每帧 33ms；限到 1 万点后约 15ms。
              // 1440px 笔记本本身约 1 万点，基本不受影响；更大的屏幕点径与点距等比放大
              maxDots={10000}
              bulgeStrength={32}
              glowRadius={0}
              sparkle={true}
              waveAmplitude={0}
              cursorRadius={500}
              cursorForce={0.5}
              bulgeOnly={true}
              imageSrc={heroImage}
              imageFit="cover"
              fallbackColor="rgba(148, 163, 184, 0.25)"
              glowColor="#120F17"
            />
          )}
        </div>

        {/* 三行分别使用独立字号，保留 Figma 中明确的编辑式层级。 */}
        <div className="relative z-10 flex h-full items-center px-edge pt-28 sm:px-edge-sm sm:pt-32">
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -inset-y-12 -z-10 bg-[radial-gradient(ellipse_at_32%_50%,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.58)_42%,rgba(255,255,255,0.18)_68%,transparent_82%)] blur-xl sm:-inset-x-8 sm:-inset-y-16"
            />
            <h1
              aria-label={SITE_ROLE}
              className="hero-title w-full font-semibold text-design-light-text-primary"
            >
              <span className="block text-[10.92vw] leading-[1] tracking-display sm:text-[clamp(2.625rem,10.92vw,6.173rem)]">
                <span className="hero-word-mask relative inline-block overflow-clip align-bottom">
                  <span aria-hidden="true" className="hero-word relative inline-block">
                    Communication
                  </span>
                </span>
              </span>
              <span className="block text-[15.9vw] leading-[0.99] tracking-display sm:text-[clamp(3.875rem,15.9vw,8.994rem)]">
                <span className="hero-word-mask relative inline-block overflow-clip align-bottom">
                  <span aria-hidden="true" className="hero-word relative inline-block">
                    Designer
                  </span>
                </span>{" "}
                <span className="hero-word-mask relative inline-block overflow-clip align-bottom">
                  <span aria-hidden="true" className="hero-word relative inline-block">
                    &amp;
                  </span>
                </span>
              </span>
              <span className="block text-[8.776vw] leading-[1.08] tracking-display sm:text-[clamp(2.125rem,8.776vw,4.961rem)]">
                <span className="hero-word-mask relative inline-block overflow-clip align-bottom">
                  <span aria-hidden="true" className="hero-word relative inline-block">
                    Frontend Developer
                  </span>
                </span>
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* 底部信息区：一条 12 列的基线带，按重要性分成两组 ——
          左侧是定位文案（主信息），右侧一栏只放联系入口（动作）。
          所在地标签不在这里：它跟着 About 预览里的浮动人像走（见 about-preview.tsx）。
          文案字号刻意低于标题第三行一档，不和 h1 抢层级；CTA 放大到本区最重的一级。
          DOM 顺序即阅读顺序，移动端直接纵向堆叠。 */}
      <div className="relative z-10 shrink-0 bg-background px-edge pb-6 pt-5 sm:px-edge-sm sm:pb-8 sm:pt-6">
        <div className="flex flex-col gap-5 sm:grid sm:grid-cols-12 sm:items-end sm:gap-x-4">
          <p className="hero-description text-pretty text-[1.375rem] leading-[1.12] tracking-[-0.02em] text-design-light-text-primary sm:col-span-8 sm:text-[clamp(1.5rem,2.2vw,2rem)] sm:leading-[1.15]">
            {reducedMotion ? (
              <EmphasizedDescription
                text={hero.description}
                terms={hero.emphasizedTerms}
              />
            ) : (
              <DecryptedText
                text={hero.description}
                sequential
                revealDirection="start"
                speed={30}
                animateOn="view"
                emphasizedTerms={hero.emphasizedTerms}
                emphasizedClassName="font-bold"
                encryptedClassName="text-design-light-text-muted/50"
              />
            )}
          </p>
          <div className="flex sm:col-span-4 sm:col-start-9 lg:col-span-3 lg:col-start-10">
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="hero-cta inline-flex min-h-11 w-fit touch-manipulation items-center border-b-2 border-current text-2xl font-semibold leading-[1.15] tracking-[-0.04em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:min-h-0 sm:text-[clamp(1.5rem,2.2vw,2rem)]"
            >
              {hero.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
