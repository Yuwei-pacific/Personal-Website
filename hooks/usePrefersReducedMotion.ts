"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

// SSR 期间按 false 处理（渲染动画版本），水合后立即读到真实偏好
const getServerSnapshot = () => false;

/** 订阅系统"减弱动画"偏好；偏好在运行中变化时组件会随之更新 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
