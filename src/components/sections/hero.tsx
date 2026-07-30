// 首页 Hero 区：依赖的交互点阵与入场动画
"use client";

import dynamic from "next/dynamic";

import DecryptedText from "@/components/vendor/DecryptedText";
import { useHeroAnimation } from "@/hooks/use-hero-animation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// Hero 点阵取色图的 art direction：横屏用全景棱镜图，竖屏用竖版构图
const HERO_IMAGE_LANDSCAPE = "/hero_mg.svg";
const HERO_IMAGE_PORTRAIT = "/hero_mg_portrait.svg";
const HERO_DESCRIPTION =
  "I create visual identities, digital interfaces and custom websites for creative studios and design‑led organisations.";
const HERO_DESCRIPTION_EMPHASIS = [
  "visual identities",
  "digital interfaces",
  "custom websites",
];

// DotFieldImage 交互点阵背景（DotField 扩展版，支持按图片取色）：
// canvas 渲染，关闭 SSR（避免内部随机 SVG id 造成水合不匹配）；
// props 类型来自 vendor 目录的 .d.ts 声明
const DotFieldImage = dynamic(() => import("@/components/vendor/DotFieldImage"), {
  ssr: false,
});

// Hero 组件：首页主视觉区，包含角色标题、定位文案与联系入口
export function Hero() {
  const heroRef = useHeroAnimation<HTMLElement>();

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
        <div className="relative z-10 flex h-full items-center px-6 pt-28 sm:px-16 sm:pt-32">
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 bg-[radial-gradient(ellipse_at_32%_50%,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.58)_42%,rgba(255,255,255,0.18)_68%,transparent_82%)] blur-xl sm:-inset-x-16 sm:-inset-y-16"
            />
            <h1
              aria-label="Communication Designer & Frontend Developer"
              className="hero-title w-full font-semibold text-design-light-text-primary"
            >
              <span className="block text-[10.92vw] leading-[1] tracking-[-0.025em] sm:text-[clamp(2.625rem,10.92vw,6.173rem)]">
                <span className="hero-word-mask relative inline-block overflow-clip align-bottom">
                  <span aria-hidden="true" className="hero-word relative inline-block">
                    Communication
                  </span>
                </span>
              </span>
              <span className="block text-[15.9vw] leading-[0.99] tracking-[-0.025em] sm:text-[clamp(3.875rem,15.9vw,8.994rem)]">
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
              <span className="block text-[8.776vw] leading-[1.08] tracking-[-0.025em] sm:text-[clamp(2.125rem,8.776vw,4.961rem)]">
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

      {/* 定位与服务描述：移动端纵向排列，桌面端将 CTA 固定在文案右下侧。 */}
      <div className="relative z-10 shrink-0 bg-background px-6 pb-6 pt-5 sm:px-16 sm:pb-6 sm:pt-3.5">
        <p className="hero-label whitespace-nowrap text-[0.6875rem] font-semibold uppercase leading-[1.25] tracking-[0.18em] text-design-light-text-primary sm:text-base sm:tracking-[0.23em]">
          Milan, Italy · Independent practice
        </p>
        <div className="relative mt-3.5">
          <p className="hero-description text-pretty text-[1.375rem] leading-[1.12] tracking-[-0.02em] text-design-light-text-primary sm:pr-36 sm:text-[clamp(2rem,2.65vw,2.5rem)] sm:leading-[1.1]">
            {reducedMotion ? (
              <>
                I create <strong className="font-bold">visual identities</strong>,{" "}
                <strong className="font-bold">digital interfaces</strong> and{" "}
                <strong className="font-bold">custom websites</strong> for creative
                studios and design‑led organisations.
              </>
            ) : (
              <DecryptedText
                text={HERO_DESCRIPTION}
                sequential
                revealDirection="start"
                speed={30}
                animateOn="view"
                emphasizedTerms={HERO_DESCRIPTION_EMPHASIS}
                emphasizedClassName="font-bold"
                encryptedClassName="text-design-light-text-muted/50"
              />
            )}
          </p>
          <a
            href="mailto:yuweidesign@outlook.com"
            className="hero-cta mt-2 inline-flex min-h-11 w-fit touch-manipulation items-center border-b-2 border-current text-lg font-semibold leading-[1.15] tracking-[-0.04em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:absolute sm:bottom-1 sm:right-0 sm:mt-0 sm:min-h-0 sm:text-xl"
          >
            Get In Touch &gt;
          </a>
        </div>
      </div>
    </section>
  );
}
