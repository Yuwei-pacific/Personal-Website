"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Safari 会把根画布的背景用于页面合成和浏览器工具栏着色。这里保持根画布
// 使用站点的浅色 token；深色区块继续由各自的背景绘制，避免滚入 Work 后
// Safari 把整页以及 mix-blend-difference 的合成基准一并切成黑色。
export function OverscrollBackground() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootBackground = root.style.backgroundColor;
    const previousBodyBackground = body.style.backgroundColor;
    const lightBackground = "hsl(var(--color-bg-light))";

    root.style.backgroundColor = lightBackground;
    body.style.backgroundColor = lightBackground;

    return () => {
      root.style.backgroundColor = previousRootBackground;
      body.style.backgroundColor = previousBodyBackground;
    };
  }, [pathname]);

  return null;
}
