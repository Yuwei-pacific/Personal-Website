"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on non-touch devices
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
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

    const onMouseMove = (e: MouseEvent) => {
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

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest("a, button, input, textarea, select, .cursor-hover, [role='button']");
      gsap.to(dot, {
        scale: isInteractive ? 2.666 : 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseover", onMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block"
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
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
