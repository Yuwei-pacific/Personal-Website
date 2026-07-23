"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/scroll-trigger";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Total vertical travel in px across the scroll range (desktop only). */
  offset?: number;
};

// 视差滚动：桌面端随滚动以不同速度位移，让左右两栏产生层次感
export function Parallax({ children, className, offset = 60 }: ParallaxProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) {
      return;
    }

    gsap.fromTo(
      targetRef.current,
      { y: -offset / 2 },
      {
        y: offset / 2,
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          // 用整个元素从视口底部进入、到完全离开顶部的范围，
          // 让视差行程更长、更明显
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }, { scope: triggerRef, dependencies: [offset] });

  return (
    <div ref={triggerRef} className={className}>
      <div ref={targetRef} className="h-full w-full">
        {children}
      </div>
    </div>
  );
}
