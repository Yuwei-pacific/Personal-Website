"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** 额外延迟（秒），用于在同一行/列的多个元素之间制造错落感 */
  delay?: number;
};

// 滚动进入视口时，淡入并向上滑动；只在首次进入时触发一次
export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(ref.current, { autoAlpha: 1 });
      return;
    }

    gsap.from(ref.current, {
      autoAlpha: 0,
      y: 40,
      duration: 0.7,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        once: true,
      },
    });
  }, { scope: ref, dependencies: [delay] });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
