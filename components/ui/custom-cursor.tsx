"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();

  // Current target mouse position
  const mouse = useRef({ x: -100, y: -100 });
  // The animated (delayed) position
  const delayedMouse = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Only run on non-touch devices
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    let animationFrameId: number;
    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!isVisible && cursorRef.current) {
        cursorRef.current.style.opacity = "1";
        isVisible = true;
      }
    };

    const onMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
        isVisible = false;
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    const updateCursor = () => {
      // Spring physics (lerp)
      // speed controls how fast it catches up (0.0 to 1.0)
      const speed = 0.2;
      
      delayedMouse.current.x += (mouse.current.x - delayedMouse.current.x) * speed;
      delayedMouse.current.y += (mouse.current.y - delayedMouse.current.y) * speed;

      if (cursorRef.current) {
        // We use translate3d for better performance
        cursorRef.current.style.transform = `translate3d(${delayedMouse.current.x}px, ${delayedMouse.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(updateCursor);
    };

    updateCursor();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Handle hover states
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Triggers hover state for a, button, input, or any element with .cursor-hover
      const isInteractive = target.closest("a, button, input, textarea, select, .cursor-hover, [role='button']");
      setIsHovering(!!isInteractive);
    };

    document.addEventListener("mouseover", handleMouseOver);
    return () => document.removeEventListener("mouseover", handleMouseOver);
  }, [pathname]);

  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block"
        style={{
          marginLeft: "-12px",
          marginTop: "-12px",
          opacity: 0,
          transition: "opacity 0.3s ease",
          willChange: "transform",
          mixBlendMode: "difference",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: isHovering ? "scale(2.666)" : "scale(1)",
            transformOrigin: "center center",
          }}
        />
      </div>
    </>
  );
}
