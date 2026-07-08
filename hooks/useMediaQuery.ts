"use client";

import { useSyncExternalStore } from "react";

// 订阅任意 media query；SSR 期间返回 false，水合后立即读到真实值。
// （与 usePrefersReducedMotion 同一套 useSyncExternalStore 模式）
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
