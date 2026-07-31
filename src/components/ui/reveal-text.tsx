"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/scroll-trigger";

type RevealTextProps = {
  text: string;
  className?: string;
  as?: "p" | "h1" | "h2";
  /** Color of words before they are revealed */
  fromColor?: string;
  /** Color of words once revealed */
  toColor?: string;
};

const resolveCssColor = (color: string) => {
  if (typeof window === "undefined") return color;

  const probe = document.createElement("span");
  probe.style.color = color;
  probe.style.position = "absolute";
  probe.style.pointerEvents = "none";
  probe.style.visibility = "hidden";

  document.documentElement.appendChild(probe);
  const resolvedColor = getComputedStyle(probe).color;
  probe.remove();

  return resolvedColor || color;
};

// 大段文案逐词上色：随滚动从浅灰过渡到深色，营造"逐句点亮"的阅读节奏
export function RevealText({
  text,
  className,
  as: Tag = "p",
  fromColor = "hsl(var(--color-border-light))",
  toColor = "hsl(var(--color-text-primary-light))",
}: RevealTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useGSAP(() => {
    const wordEls = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(".reveal-word") ?? [],
    );
    if (!wordEls.length) return;

    const resolvedFromColor = resolveCssColor(fromColor);
    const resolvedToColor = resolveCssColor(toColor);

    if (prefersReducedMotion()) {
      wordEls.forEach((wordEl) => {
        wordEl.style.color = resolvedToColor;
      });
      return;
    }

    // Normalize the SSR token value before GSAP reads it. Safari exposes the
    // inline `hsl(var(--token))` string here, which GSAP's color parser cannot
    // interpolate reliably even though the browser resolves it to a valid RGB.
    wordEls.forEach((wordEl) => {
      wordEl.style.color = resolvedFromColor;
    });

    gsap.to(wordEls, {
      color: resolvedToColor,
      stagger: 0.04,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        end: "bottom 60%",
        scrub: true,
      },
    });
  }, { scope: containerRef, dependencies: [fromColor, toColor] });

  return (
    <Tag ref={containerRef as React.Ref<never>} className={className}>
      {words.flatMap((word, i) => {
        const span = (
          <span className="reveal-word" key={`word-${i}`} style={{ color: fromColor }}>
            {word}
          </span>
        );
        return i < words.length - 1 ? [span, " "] : [span];
      })}
    </Tag>
  );
}
