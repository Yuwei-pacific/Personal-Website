"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/scroll-trigger";
import { cn } from "@/lib/utils";

type RevealTextProps = {
  text: string;
  className?: string;
  as?: "p" | "h1" | "h2";
  /**
   * Color of words before they are revealed.
   * 必须自身满足正文对比度（≥4.5:1）：这个值是写成内联 style 进 SSR HTML 的，
   * 且 reveal-word-base 没有任何样式表兜底 —— 无 JS 时它就是最终颜色。
   */
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
  fromColor = "hsl(var(--color-text-muted-light))",
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

    const container = containerRef.current;
    const target = document.getElementById(maskTargetId);
    const contrastLayer =
      container.querySelector<HTMLElement>(".reveal-contrast-layer");
    // base 文字层：与反差层逐像素重合（同一套 className，含外边距），用它来量反差层的盒子
    const baseLayer = container.firstElementChild;
    if (!target || !contrastLayer || !baseLayer) return;

    // 上一次写入的几何，没变就不碰样式（逐帧运行时绝大多数帧都是这种情况）
    let lastGeometry = "";
    const maskUrl = `url("${maskImageSrc}")`;
    // 目标图还没画出来之前不能显示反差层：反差字在点亮后是背景色（白），
    // 人像缺席时就成了白底白字，首屏会看到几个字母"消失"。图片 load 后由下方监听重新计算。
    const isTargetPainted = () =>
      !(target instanceof HTMLImageElement) ||
      (target.complete && target.naturalWidth > 0);

    const updateMasks = () => {
      const targetRect = target.getBoundingClientRect();

      // 遮罩和裁剪的坐标都以反差层自己的盒子为原点，所以必须量到那个盒子。
      // 不能量反差层本身：它被 display:none 隐藏后尺寸为 0，相交判断会永远为假。
      // 也不能量外层容器：className 里的外边距（如 mt-4）让反差层比容器低一截，
      // 以容器为原点算出来的遮罩就整体下移同样的距离 —— 人像肩线处的字母会漏出半个黑字。
      // base 文字层和反差层共用 className、位置完全重合，量它正好。
      const layerRect = baseLayer.getBoundingClientRect();
      const intersects = !(
        layerRect.right <= targetRect.left ||
        layerRect.left >= targetRect.right ||
        layerRect.bottom <= targetRect.top ||
        layerRect.top >= targetRect.bottom
      );

      if (!intersects || !isTargetPainted()) {
        if (lastGeometry !== "hidden") {
          lastGeometry = "hidden";
          contrastLayer.style.display = "none";
          contrastLayer.style.opacity = "1";
        }
        return;
      }

      const clipTop = Math.max(0, targetRect.top - layerRect.top);
      const clipRight = Math.max(0, layerRect.right - targetRect.right);
      const clipBottom = Math.max(0, layerRect.bottom - targetRect.bottom);
      const clipLeft = Math.max(0, targetRect.left - layerRect.left);
      const maskPosition = `${targetRect.left - layerRect.left}px ${targetRect.top - layerRect.top}px`;
      const maskSize = `${targetRect.width}px auto`;
      const clipPath = `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;

      const geometry = `${clipPath}|${maskPosition}|${maskSize}`;
      if (geometry === lastGeometry) return;
      lastGeometry = geometry;

      contrastLayer.style.display = "block";
      contrastLayer.style.clipPath = clipPath;
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

    // 逐帧跟随，而不是监听 scroll：人像的位置由 GSAP（Parallax 的 scrub）在它的 ticker 里
    // 写入 transform。在 scroll 事件后另排一帧去量，可能量到上一帧的人像，而滚动一停就不再
    // 有事件来纠正。挂在同一个 ticker 上、排在 GSAP 自己的更新之后，每帧量到的都是这一帧
    // 已经落定的位置。只在文字靠近视口时才运行，离开后摘掉。
    let ticking = false;
    const startTicking = () => {
      if (ticking) return;
      ticking = true;
      gsap.ticker.add(updateMasks);
    };
    const stopTicking = () => {
      if (!ticking) return;
      ticking = false;
      gsap.ticker.remove(updateMasks);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTicking();
        } else {
          stopTicking();
        }
      },
      { rootMargin: "50% 0px" },
    );
    visibilityObserver.observe(container);
    target.addEventListener("load", updateMasks);
    updateMasks();

    return () => {
      stopTicking();
      visibilityObserver.disconnect();
      target.removeEventListener("load", updateMasks);
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
