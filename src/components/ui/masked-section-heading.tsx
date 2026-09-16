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
  /**
   * count 的本地化可读标签（如 "5 progetti"），拼进标题的可访问名。
   * 必须由调用方从字典传入 —— 组件本身不该知道语言。
   */
  countAriaLabel?: string;
};

// 大型 section 标题：复用 Hero / 导航的遮罩揭示语言，在进入视口时播放一次。
export function MaskedSectionHeading({
  title,
  count,
  countAriaLabel,
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
        gsap.set(itemEls, { y: 0, yPercent: 0, rotation: 0 });
        return;
      }

      gsap.set(itemEls, maskedTextHiddenVars());

      const section = headingRef.current?.closest<HTMLElement>("section[id]");
      const isCurrentAnchor =
        section && window.location.hash === `#${section.id}`;

      // 跨路由返回 /#work 时，锚点定位发生在新页面挂载之后，
      // ScrollTrigger 可能错过 onEnter。锚点就是当前 section 时直接播放，
      // 仍复用完全相同的 reveal 参数。
      if (isCurrentAnchor) {
        gsap.to(itemEls, maskedTextRevealVars());
        return;
      }

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
        {/* 可访问名放在 h2 上，视觉层整体 aria-hidden —— 与同目录已写对的
            masked-text-heading.tsx 保持同构。动画会把标题拆成多个 span，
            不给 h2 命名的话读屏拿到的是拆散后的碎片。 */}
        <h2
          aria-label={countAriaLabel ? `${title} ${countAriaLabel}` : title}
          className="min-w-0 text-display-sm font-semibold tracking-display text-design-dark-text-primary lg:text-display"
        >
          <span aria-hidden="true" className="inline-block overflow-clip align-bottom">
            <span className="masked-section-heading-item relative inline-block">
              {title}
            </span>
          </span>
        </h2>

        {/* 计数已并入 h2 的可访问名，视觉层对 AT 隐藏。
            此前这里的 aria-label 挂在一个无语义的 span 上（ARIA 1.2 禁止为
            generic 角色命名，多数读屏直接忽略），且 "projects" 是硬编码英文，
            在 /it 页面会念出英文。 */}
        {typeof count === "number" && (
          <span aria-hidden="true" className="inline-block shrink-0 overflow-clip">
            <span className="masked-section-heading-item relative inline-block font-mono text-small font-medium text-design-dark-text-muted sm:text-body">
              ({count})
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
