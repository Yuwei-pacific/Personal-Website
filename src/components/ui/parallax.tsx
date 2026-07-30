"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/scroll-trigger";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Total vertical travel in px across the desktop scroll range. */
  offset?: number;
  /** Optional lighter travel for viewports below 1024px. */
  mobileOffset?: number;
};

// 响应式视差滚动：桌面保留完整位移，移动端可传入更轻的位移。
export function Parallax({
  children,
  className,
  offset = 60,
  mobileOffset = 0,
}: ParallaxProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const target = targetRef.current;
    if (!target) return;

    if (prefersReducedMotion()) {
      gsap.set(target, { y: 0 });
      return;
    }

    const media = gsap.matchMedia();
    const createParallax = (travel: number) => {
      gsap.fromTo(
        target,
        { y: -travel / 2 },
        {
          y: travel / 2,
          ease: "none",
          scrollTrigger: {
            trigger: triggerRef.current,
            // 用整个元素从视口底部进入、到完全离开顶部的范围，
            // 让位移在完整滚动区间内保持连续。
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    };

    media.add("(min-width: 1024px)", () => {
      createParallax(offset);
    });

    media.add("(max-width: 1023px)", () => {
      if (mobileOffset === 0) {
        gsap.set(target, { y: 0 });
        return;
      }

      createParallax(mobileOffset);
    });

    return () => media.revert();
  }, { scope: triggerRef, dependencies: [offset, mobileOffset] });

  return (
    <div ref={triggerRef} className={className}>
      <div ref={targetRef} className="h-full w-full">
        {children}
      </div>
    </div>
  );
}
