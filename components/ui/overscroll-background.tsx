"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function OverscrollBackground() {
  const pathname = usePathname();

  useEffect(() => {
    let isDark = false;
    const handleScroll = () => {
      // If we are within 800px of the bottom (entering Projects section)
      const isNearBottom = window.scrollY + window.innerHeight > document.body.scrollHeight - 800;
      
      if (isNearBottom && !isDark) {
        document.documentElement.style.backgroundColor = "hsl(var(--color-bg-dark))";
        document.body.style.backgroundColor = "hsl(var(--color-bg-dark))";
        isDark = true;
      } else if (!isNearBottom && isDark) {
        // Restore to default light background
        document.documentElement.style.backgroundColor = "hsl(var(--background))";
        document.body.style.backgroundColor = "hsl(var(--background))";
        isDark = false;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check immediately on mount

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, [pathname]);

  return null;
}
