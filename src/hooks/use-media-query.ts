"use client";

import { useCallback, useSyncExternalStore } from "react";

const getServerSnapshot = () => false;

// 订阅任意 media query；SSR 期间返回 false，水合后立即读到真实值。
// （与 usePrefersReducedMotion 同一套 useSyncExternalStore 模式）
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
