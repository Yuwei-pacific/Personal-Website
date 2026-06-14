"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// Hero 入场动画：标题、描述、状态标签、CTA 与社交图标按时间线依次淡入上滑
export function useHeroAnimation<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([".hero-label", ".hero-title", ".hero-description", ".hero-status", ".hero-cta", ".hero-social-icon"], {
        autoAlpha: 1,
      });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .from(".hero-label", { autoAlpha: 0, y: 20, duration: 0.8 })
        .from(".hero-title", { autoAlpha: 0, y: 30, duration: 0.8 }, "-=0.6")
        .from(".hero-description", { autoAlpha: 0, y: 20, duration: 0.8 }, "-=0.6")
        .from(".hero-status", { autoAlpha: 0, y: 15, duration: 0.6 }, "-=0.5")
        .from(".hero-cta", { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.15 }, "-=0.4")
        .from(".hero-social-icon", { autoAlpha: 0, scale: 0.8, duration: 0.6, stagger: 0.1 }, "-=0.2");
    });
  }, { scope: containerRef });

  return containerRef;
}
