"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animation/gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on non-touch devices; also respect prefers-reduced-motion
    // (跳过时保持元素透明，系统默认光标不受影响)
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        prefersReducedMotion())
    ) {
      return;
    }

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    // quickTo reuses a single tween for fast-updating properties (mouse follower)
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.3, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.3, ease: "power3" });

    let isVisible = false;
    let hasPositioned = false;
    let isInteractive = false;
    let hoverTween: gsap.core.Tween | null = null;

    // 只跟随真正的鼠标。用 pointer 事件而不是 mouse 事件：触屏点一下，浏览器会补发一组
    // 模拟的 mousemove，方块就会出现在点击处并一直停在那里 —— 接了触控板或键盘的 iPad
    // 主指针是 fine，上面的 (pointer: coarse) 拦不住它。
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;

      if (!hasPositioned) {
        // Snap to the first position instantly to avoid flying in from the corner
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        hasPositioned = true;
      } else {
        xTo(e.clientX);
        yTo(e.clientY);
      }

      if (!isVisible) {
        gsap.to(cursor, { autoAlpha: 1, duration: 0.3 });
        isVisible = true;
      }
    };

    const onMouseLeave = () => {
      gsap.to(cursor, { autoAlpha: 0, duration: 0.3 });
      isVisible = false;
    };

    // 混合输入设备上改用手指或触控笔时，把跟随方块收起来，不留在最后的鼠标位置
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !isVisible) return;
      gsap.set(cursor, { autoAlpha: 0 });
      isVisible = false;
      hasPositioned = false;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nextIsInteractive = Boolean(
        target.closest("a, button, input, textarea, select, .cursor-hover, [role='button']")
      );
      if (nextIsInteractive === isInteractive) return;

      isInteractive = nextIsInteractive;
      hoverTween?.kill();
      hoverTween = gsap.to(dot, {
        scale: isInteractive ? 2.666 : 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseover", onMouseOver);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseover", onMouseOver);
      hoverTween?.kill();
      xTo.tween.kill();
      yTo.tween.kill();
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-cursor hidden md:block"
      style={{
        marginLeft: "-12px",
        marginTop: "-12px",
        opacity: 0,
        willChange: "transform",
        mixBlendMode: "difference",
      }}
    >
      <div
        ref={dotRef}
        style={{
          width: "24px",
          height: "24px",
          backgroundColor: "hsl(var(--color-text-primary-dark))",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
