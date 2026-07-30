"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/gsap-react";
import {
  maskedTextHiddenVars,
  maskedTextRevealVars,
} from "@/lib/animation/masked-text-reveal";

const HERO_TARGETS = [".hero-label", ".hero-title", ".hero-description", ".hero-cta"];

// Hero 入场动画：标题逐词从遮罩下方旋转揭示，其余内容按时间线淡入上滑
export function useHeroAnimation<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set(HERO_TARGETS, { autoAlpha: 1 });
      gsap.set(".hero-word", { yPercent: 0, rotation: 0 });
      return;
    }

    // 先把所有目标设置到动画起始状态，避免 immediateRender 在 stagger 下只对第一个元素生效，
    // 导致后续元素先短暂可见、动画播放到该元素时才骤然消失。
    gsap.set(".hero-label", { autoAlpha: 0, y: 20 });
    gsap.set(".hero-title", { autoAlpha: 1 });
    gsap.set(".hero-word", maskedTextHiddenVars());
    gsap.set(".hero-description", { autoAlpha: 0, y: 20 });
    gsap.set(".hero-cta", { autoAlpha: 0, y: 20 });

    gsap
      .timeline({ defaults: { ease: "power2.out" } })
      .addLabel("intro", 0)
      .to(".hero-label", { autoAlpha: 1, y: 0, duration: 0.55 }, "intro")
      .to(
        ".hero-word",
        maskedTextRevealVars(),
        "intro+=0.14"
      )
      .to(
        ".hero-description",
        { autoAlpha: 1, y: 0, duration: 0.7 },
        "intro+=0.48"
      )
      .to(
        ".hero-cta",
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12 },
        "intro+=0.68"
      );
  }, { scope: containerRef });

  return containerRef;
}
