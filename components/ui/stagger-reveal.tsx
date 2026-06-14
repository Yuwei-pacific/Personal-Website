"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type StaggerRevealProps = {
  children: ReactNode;
  className?: string;
  /** 直接子元素的选择器，默认作用于所有直接子元素 */
  selector?: string;
};

// 滚动进入视口时，子元素依次淡入并向上滑动
export function StaggerReveal({ children, className, selector = ":scope > *" }: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;

    const targets = ref.current.querySelectorAll(selector);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(targets, { autoAlpha: 1 });
      return;
    }

    gsap.from(targets, {
      autoAlpha: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ref.current,
        // 用 "top bottom" 让元素一进入视口就触发——避免页面底部元素
        // 永远到不了 "top 85%" 触发线而卡在 autoAlpha:0
        start: "top bottom-=80",
        once: true,
      },
    });
  }, { scope: ref });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
