"use client";

// Lenis 平滑滚动接入：
// - 由 GSAP ticker 驱动（autoRaf 关闭），ScrollTrigger 跟随 lenis 滚动刷新，
//   避免两套 rAF 循环并存（官方推荐的 GSAP 集成方式）
// - anchors：站内 <a href="#..."> 锚点点击走 Lenis 平滑滚动
// - 减弱动画偏好 / Sanity Studio（自带内部滚动容器）下不启用，保持原生滚动
import { ReactLenis, useLenis } from "lenis/react";
import type { LenisProps } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { gsap, ScrollTrigger } from "@/lib/animation/scroll-trigger";

// 锚点落点上移 96px，对应 #work 等区块的 scroll-mt-24：
// Lenis 的 scrollTo 不读 CSS scroll-margin，这里用 offset 保持与原生跳转一致
const LENIS_OPTIONS: LenisProps["options"] = {
  autoRaf: false,
  anchors: { offset: -96 },
};

// 必须作为 ReactLenis 的子组件、通过 useLenis 拿实例：
// 实例是在 ReactLenis 的 effect 里异步创建的，挂载当帧从 ref 上读不到；
// useLenis 订阅 context，实例就绪时 effect 会带着实例重跑。
// autoRaf 关闭后这里是唯一的驱动源——不接上 ticker 页面就完全滚不动
function LenisGsapSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    lenis.on("scroll", ScrollTrigger.update);
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    // Lenis 官方建议：关掉 GSAP 的 lag smoothing，防止掉帧后滚动位置跳变
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(update);
      // 恢复 GSAP 默认值
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [lenis]);

  return null;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  const enabled = !reducedMotion && !pathname?.startsWith("/studio");

  if (!enabled) return <>{children}</>;

  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      <LenisGsapSync />
      {children}
    </ReactLenis>
  );
}
