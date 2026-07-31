"use client";

import { useRef } from "react";

import {
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/animation/scroll-trigger";
import {
  maskedTextHiddenVars,
  maskedTextRevealVars,
} from "@/lib/animation/masked-text-reveal";

type MaskedTextHeadingProps = {
  text: string;
  className?: string;
};

// 通用标题遮罩揭示：与 Hero、导航和 Work 标题共享同一组运动参数。
export function MaskedTextHeading({
  text,
  className,
}: MaskedTextHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const words = text.trim().split(/\s+/);

  useGSAP(
    () => {
      const wordEls =
        headingRef.current?.querySelectorAll<HTMLElement>(
          ".masked-text-heading-item"
        );

      if (!wordEls?.length) return;

      if (prefersReducedMotion()) {
        gsap.set(wordEls, { y: 0, yPercent: 0, rotation: 0 });
        return;
      }

      gsap.set(wordEls, maskedTextHiddenVars());
      gsap.to(wordEls, {
        ...maskedTextRevealVars(),
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope: headingRef }
  );

  return (
    <h2 ref={headingRef} aria-label={text} className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <span
            aria-hidden="true"
            className="inline-block overflow-clip align-bottom"
          >
            <span className="masked-text-heading-item relative inline-block">
              {word}
            </span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </h2>
  );
}
