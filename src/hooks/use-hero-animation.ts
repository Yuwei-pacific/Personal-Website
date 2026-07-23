"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/gsap-react";

const HERO_TARGETS = [".hero-label", ".hero-title", ".hero-description", ".hero-cta"];

// Hero 入场动画：标题、描述、状态标签、CTA 与社交图标按时间线依次淡入上滑
export function useHeroAnimation<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set(HERO_TARGETS, { autoAlpha: 1 });
      return;
    }

    // 先把所有目标设置到动画起始状态，避免 immediateRender 在 stagger 下只对第一个元素生效，
    // 导致后续元素先短暂可见、动画播放到该元素时才骤然消失。
    gsap.set(".hero-label", { autoAlpha: 0, y: 20 });
    gsap.set(".hero-title", { autoAlpha: 0, y: 30 });
    gsap.set(".hero-description", { autoAlpha: 0, y: 20 });
    gsap.set(".hero-cta", { autoAlpha: 0, y: 20 });

    gsap
      .timeline({ defaults: { ease: "power2.out" } })
      .to(".hero-label", { autoAlpha: 1, y: 0, duration: 0.8 })
      .to(".hero-title", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(".hero-description", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(".hero-cta", { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15 }, "-=0.4");
  }, { scope: containerRef });

  return containerRef;
}
