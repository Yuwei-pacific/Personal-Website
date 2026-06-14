"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Total vertical travel in px across the scroll range (desktop only). */
  offset?: number;
};

// 视差滚动：桌面端随滚动以不同速度位移，让左右两栏产生层次感
export function Parallax({ children, className, offset = 60 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.innerWidth < 1024
    ) {
      return;
    }

    gsap.fromTo(
      ref.current,
      { y: -offset / 2 },
      {
        y: offset / 2,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      }
    );
  }, { scope: ref });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
