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
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden mix-blend-difference md:flex"
        style={{
          // Center the cursor exactly on the mouse coordinates
          marginLeft: "-12px",
          marginTop: "-12px",
          opacity: 0, // start hidden until mouse moves
          transition: "opacity 0.3s ease",
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden", // Hardware acceleration for Safari
        }}
      >
        <div
          className={`rounded-full bg-white transition-all duration-300 ease-out flex items-center justify-center ${
            isHovering ? "h-[64px] w-[64px] opacity-100" : "h-[24px] w-[24px] opacity-100"
          }`}
          style={{
            // Compensate for the size change to keep it perfectly centered
            // From 24px to 64px is an increase of 40px, so we need to translate by -20px
            transform: isHovering ? "translate(-20px, -20px)" : "translate(0, 0)",
          }}
        />
      </div>
    </>
  );
}
