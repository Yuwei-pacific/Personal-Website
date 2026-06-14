"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type RevealTextProps = {
  text: string;
  className?: string;
  /** Color of words before they are revealed */
  fromColor?: string;
  /** Color of words once revealed */
  toColor?: string;
};

// 大段文案逐词上色：随滚动从浅灰过渡到深色，营造"逐句点亮"的阅读节奏
export function RevealText({
  text,
  className,
  fromColor = "#d4d4d4",
  toColor = "#171717",
}: RevealTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useGSAP(() => {
    const wordEls = containerRef.current?.querySelectorAll<HTMLElement>(".reveal-word");
    if (!wordEls?.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(wordEls, { color: toColor });
      return;
    }

    gsap.set(wordEls, { color: fromColor });

    gsap.to(wordEls, {
      color: toColor,
      stagger: 0.04,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        end: "bottom 60%",
        scrub: true,
      },
    });
  }, { scope: containerRef });

  return (
    <p ref={containerRef} className={className}>
      {words.flatMap((word, i) => {
        const span = (
          <span className="reveal-word" key={`word-${i}`}>
            {word}
          </span>
        );
        return i < words.length - 1 ? [span, " "] : [span];
      })}
    </p>
  );
}
