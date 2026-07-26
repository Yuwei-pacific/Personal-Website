"use client";

import { useMediaQuery } from "./use-media-query";

const QUERY = "(prefers-reduced-motion: reduce)";

/** 订阅系统"减弱动画"偏好；偏好在运行中变化时组件会随之更新 */
export function usePrefersReducedMotion() {
  return useMediaQuery(QUERY);
}
