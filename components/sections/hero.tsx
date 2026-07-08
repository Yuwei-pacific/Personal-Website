// 首页 Hero 区：依赖的 Next.js 组件、图标与按钮
"use client";

import dynamic from "next/dynamic";
import { Link } from "next-view-transitions";

import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import DecryptedText from "@/components/vendor/DecryptedText";
import { useHeroAnimation } from "@/hooks/useHeroAnimation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// Hero 点阵取色图的 art direction：横屏用全景棱镜图，竖屏用竖版构图
const HERO_IMAGE_LANDSCAPE = "/hero_mg.svg";
const HERO_IMAGE_PORTRAIT = "/hero_mg_portrait.svg";

// DotFieldImage 交互点阵背景（DotField 扩展版，支持按图片取色）：
// canvas 渲染，关闭 SSR（避免内部随机 SVG id 造成水合不匹配）；
// props 类型来自 vendor 目录的 .d.ts 声明
const DotFieldImage = dynamic(() => import("@/components/vendor/DotFieldImage"), {
  ssr: false,
});

// Hero 组件：首页主视觉区，包含标题、描述与 CTA 按钮
export function Hero() {
  const heroRef = useHeroAnimation<HTMLElement>();

  // 尊重"减弱动画"偏好：偏好开启时不渲染点阵（其 rAF 循环会持续运行）
  const reducedMotion = usePrefersReducedMotion();

  // 按屏幕方向选取色图（art direction）；imageSrc 变化时点阵会自动重新取色
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const heroImage = isPortrait ? HERO_IMAGE_PORTRAIT : HERO_IMAGE_LANDSCAPE;

  return (
    // 全屏容器：相对定位，隔离层叠上下文，居中内容
    // 导航已改为 fixed 浮层不占文档流，hero 直接铺满整个视口
    <section ref={heroRef} id="home" className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden px-container-sm py-16 sm:px-10 md:px-16">
      {/* 背景装饰层：限制在 hero 内部，不影响主页后续区块
          （背景色即统一白，不再叠加渐变） */}
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
            // cover：等比缩放铺满 + 居中裁边——不变形、不随窗口尺寸漂移、不留空带；
            // 竖屏的构图问题由竖版取色图解决（见 HERO_IMAGE_PORTRAIT）
            imageFit="cover"
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
          <div className="relative">
            {/* 标题专属柔光：与描述句同款的文字锚定保护层 */}
            <div
              aria-hidden
              className="absolute -inset-x-8 -inset-y-10 -z-10 rounded-full bg-design-light-bg/70 blur-2xl"
            />
            <h1 className="hero-title text-[3.25rem] font-semibold leading-[0.95] tracking-tight text-design-light-text-primary sm:text-7xl lg:text-[7.5rem]">
              Creative
              <br />
              Designer
            </h1>
          </div>
        </div>

        {/* 细分隔线 + 描述/状态行：复用 About 区行表语言（细线、圆点分隔符） */}
        <div className="border-t border-design-light-border pt-6">
          <div className="flex flex-col gap-5">
            {/* 描述句：全宽展开，进入视口时逐字“解密”，只触发一次 */}
            <div className="relative">
              {/* 句子专属保护层：锚在文字上的柔光白底，任何断点都跟着这句话走；
                  调整 /70 控制浓度、inset 数值控制光晕外扩范围 */}
              <div
                aria-hidden
                className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-full bg-design-light-bg/70 blur-2xl"
              />
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
        </div>

        {/* CTA 按钮组：查看作品与联系我 */}
        <div className="flex flex-wrap gap-3">
          <Button className="hero-cta gap-2 transition-transform duration-base hover:scale-emphasis" asChild>
            <Link href="#work">
              View work <LuArrowRight className="h-4 w-4" />
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
