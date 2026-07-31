"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/scroll-trigger";
import { cn } from "@/lib/utils";

type RevealTextProps = {
  text: string;
  className?: string;
  as?: "p" | "h1" | "h2";
  /** Color of words before they are revealed */
  fromColor?: string;
  /** Color of words once revealed */
  toColor?: string;
  /** Element whose rendered image supplies the alpha mask for contrast text */
  maskTargetId?: string;
  /** Transparent image used by the mask target */
  maskImageSrc?: string;
  /** Color of masked words before they are revealed */
  contrastFromColor?: string;
  /** Color of masked words once revealed */
  contrastToColor?: string;
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
  maskTargetId,
  maskImageSrc,
  contrastFromColor = "hsl(var(--color-text-primary-light))",
  contrastToColor = "hsl(var(--color-bg-light))",
}: RevealTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(" ");
  const usesContrastMask = Boolean(maskTargetId && maskImageSrc);

  useEffect(() => {
    if (!maskTargetId || !maskImageSrc || !containerRef.current) return;

    const target = document.getElementById(maskTargetId);
    const contrastLayer =
      containerRef.current.querySelector<HTMLElement>(".reveal-contrast-layer");
    if (!target || !contrastLayer) return;

    let frame = 0;
    const maskUrl = `url("${maskImageSrc}")`;

    const updateMasks = () => {
      frame = 0;
      const targetRect = target.getBoundingClientRect();

      const layerRect = contrastLayer.getBoundingClientRect();
      const intersects = !(
        layerRect.right <= targetRect.left ||
        layerRect.left >= targetRect.right ||
        layerRect.bottom <= targetRect.top ||
        layerRect.top >= targetRect.bottom
      );

      if (!intersects) {
        contrastLayer.style.display = "none";
        contrastLayer.style.opacity = "1";
        return;
      }

      const clipTop = Math.max(0, targetRect.top - layerRect.top);
      const clipRight = Math.max(0, layerRect.right - targetRect.right);
      const clipBottom = Math.max(0, layerRect.bottom - targetRect.bottom);
      const clipLeft = Math.max(0, targetRect.left - layerRect.left);
      const maskPosition = `${targetRect.left - layerRect.left}px ${targetRect.top - layerRect.top}px`;
      const maskSize = `${targetRect.width}px auto`;

      contrastLayer.style.display = "block";
      contrastLayer.style.clipPath =
        `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;
      contrastLayer.style.setProperty("-webkit-mask-image", maskUrl);
      contrastLayer.style.setProperty("-webkit-mask-position", maskPosition);
      contrastLayer.style.setProperty("-webkit-mask-repeat", "no-repeat");
      contrastLayer.style.setProperty("-webkit-mask-size", maskSize);
      contrastLayer.style.setProperty("mask-image", maskUrl);
      contrastLayer.style.setProperty("mask-mode", "alpha");
      contrastLayer.style.setProperty("mask-position", maskPosition);
      contrastLayer.style.setProperty("mask-repeat", "no-repeat");
      contrastLayer.style.setProperty("mask-size", maskSize);
      contrastLayer.style.opacity = "1";
    };

    const scheduleMaskUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateMasks);
    };

    const resizeObserver = new ResizeObserver(scheduleMaskUpdate);
    resizeObserver.observe(target);
    resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", scheduleMaskUpdate);
    window.addEventListener("scroll", scheduleMaskUpdate, { passive: true });
    target.addEventListener("load", scheduleMaskUpdate);
    scheduleMaskUpdate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMaskUpdate);
      window.removeEventListener("scroll", scheduleMaskUpdate);
      target.removeEventListener("load", scheduleMaskUpdate);
    };
  }, [maskImageSrc, maskTargetId, text]);

  useGSAP(() => {
    const baseWordEls = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(".reveal-word-base") ?? [],
    );
    const contrastWordEls = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(".reveal-word-contrast") ?? [],
    );
    if (!baseWordEls.length) return;

    const resolvedFromColor = resolveCssColor(fromColor);
    const resolvedToColor = resolveCssColor(toColor);
    const resolvedContrastFromColor = resolveCssColor(contrastFromColor);
    const resolvedContrastToColor = resolveCssColor(contrastToColor);

    baseWordEls.forEach((wordEl) => {
      wordEl.style.color = prefersReducedMotion() ? resolvedToColor : resolvedFromColor;
    });
    contrastWordEls.forEach((wordEl) => {
      wordEl.style.color = prefersReducedMotion()
        ? resolvedContrastToColor
        : resolvedContrastFromColor;
    });

    if (prefersReducedMotion()) return;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        end: "bottom 60%",
        scrub: true,
      },
    });

    timeline.to(baseWordEls, {
      color: resolvedToColor,
      duration: 0.5,
      stagger: 0.04,
      ease: "none",
    }, 0);

    if (contrastWordEls.length) {
      timeline.to(contrastWordEls, {
        color: resolvedContrastToColor,
        duration: 0.5,
        stagger: 0.04,
        ease: "none",
      }, 0);
    }
  }, {
    scope: containerRef,
    dependencies: [contrastFromColor, contrastToColor, fromColor, text, toColor],
  });

  const renderWords = (wordClassName: string, color: string) =>
    words.flatMap((word, i) => {
      const span = (
        <span className={wordClassName} key={`word-${i}`} style={{ color }}>
          {word}
        </span>
      );
      return i < words.length - 1 ? [span, " "] : [span];
    });

  return (
    <div ref={containerRef} className="relative flow-root">
      <Tag className={className}>
        {renderWords("reveal-word-base", fromColor)}
      </Tag>
      {usesContrastMask && (
        // 反差层必须与 base 层逐像素重合，因此沿用完全相同的 className
        // （含其中的外边距）——wrapper 的 flow-root 把 base 的 margin 收在内部，
        // 若在这里用 !mt-0 抹掉，两层就会正好错开一个 margin 的距离。
        <div
          aria-hidden="true"
          className={cn(
            className,
            "reveal-contrast-layer pointer-events-none absolute inset-0 select-none opacity-0",
          )}
        >
          {renderWords("reveal-word-contrast", contrastFromColor)}
        </div>
      )}
    </div>
  );
}
