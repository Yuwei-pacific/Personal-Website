"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const HERO_TARGETS = [".hero-label", ".hero-title", ".hero-description", ".hero-status", ".hero-cta", ".hero-social-icon"];

// Hero 入场动画：标题、描述、状态标签、CTA 与社交图标按时间线依次淡入上滑
export function useHeroAnimation<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(HERO_TARGETS, { autoAlpha: 1 });
      return;
    }

    // 先把所有目标设置到动画起始状态，避免 immediateRender 在 stagger 下只对第一个元素生效，
    // 导致后续元素先短暂可见、动画播放到该元素时才骤然消失。
    gsap.set(".hero-label", { autoAlpha: 0, y: 20 });
    gsap.set(".hero-title", { autoAlpha: 0, y: 30 });
    gsap.set(".hero-description", { autoAlpha: 0, y: 20 });
    gsap.set(".hero-status", { autoAlpha: 0, y: 15 });
    gsap.set(".hero-cta", { autoAlpha: 0, y: 20 });
    gsap.set(".hero-social-icon", { autoAlpha: 0, scale: 0.8 });

    gsap
      .timeline({ defaults: { ease: "power2.out" } })
      .to(".hero-label", { autoAlpha: 1, y: 0, duration: 0.8 })
      .to(".hero-title", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(".hero-description", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(".hero-status", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.5")
      .to(".hero-cta", { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15 }, "-=0.4")
      .to(".hero-social-icon", { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.1 }, "-=0.2");
  }, { scope: containerRef });

  return containerRef;
}
