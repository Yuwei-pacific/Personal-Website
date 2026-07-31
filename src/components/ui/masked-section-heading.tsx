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

type MaskedSectionHeadingProps = {
  title: string;
  count?: number;
};

// 大型 section 标题：复用 Hero / 导航的遮罩揭示语言，在进入视口时播放一次。
export function MaskedSectionHeading({
  title,
  count,
}: MaskedSectionHeadingProps) {
  const headingRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const itemEls =
        headingRef.current?.querySelectorAll<HTMLElement>(
          ".masked-section-heading-item"
        );

      if (!itemEls?.length) return;

      if (prefersReducedMotion()) {
        gsap.set(itemEls, { yPercent: 0, rotation: 0 });
        return;
      }

      gsap.set(itemEls, maskedTextHiddenVars());
      gsap.to(itemEls, {
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
    <div
      ref={headingRef}
      className="w-full px-6 sm:px-container-sm lg:px-8"
    >
      <div className="flex w-fit items-end gap-1">
        <h2 className="min-w-0 text-display-sm font-semibold tracking-display text-design-dark-text-primary lg:text-display">
          <span className="inline-block overflow-clip align-bottom">
            <span className="masked-section-heading-item relative inline-block">
              {title}
            </span>
          </span>
        </h2>

        {typeof count === "number" && (
          <span className="inline-block shrink-0 overflow-clip">
            <span
              aria-label={`${count} projects`}
              className="masked-section-heading-item relative inline-block font-mono text-small font-medium text-design-dark-text-muted sm:text-body"
            >
              ({count})
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
