"use client";

import { useEffect } from "react";
import { useScrollTriggerAnimation } from "@/hooks/useScrollTriggerAnimation";

export function AnimationProvider({ children }: { children: React.ReactNode }) {
    useScrollTriggerAnimation();

    // 添加初始隐藏样式
    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
      /* Hero 元素初始隐藏 */
      .hero-label,
      .hero-title,
      .hero-description,
      .hero-status,
      .hero-cta,
      .hero-social-icon {
        opacity: 0;
      }

      /* 滚动进入动画元素初始隐藏 */
      .scroll-animate {
        opacity: 0;
        transform: translateY(40px);
      }

      /* 动画完成后保持可见 */
      .hero-animated .hero-label,
      .hero-animated .hero-title,
      .hero-animated .hero-description,
      .hero-animated .hero-status,
      .hero-animated .hero-cta,
      .hero-animated .hero-social-icon,
      .scroll-animate.animated {
        will-change: auto;
      }
    `;
        document.head.appendChild(style);
    }, []);

    return <>{children}</>;
}
