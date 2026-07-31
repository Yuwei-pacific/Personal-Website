"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";

// Project cards are opened from deep inside the home page. Next.js normally
// resets the window scroll, but Lenis can retain its previous target during a
// client transition and restore that position on the next animation frame.
// Reset both scroll systems after the detail route mounts so entry is always
// anchored to the project header.
export function ProjectScrollReset() {
  const lenis = useLenis();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => cancelAnimationFrame(frame);
  }, [lenis]);

  return null;
}
