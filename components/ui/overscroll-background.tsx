"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 过界回弹（overscroll）时 body 背景色的控制：
// 页面内容层自带 bg-background，body 背景只在滚动越界的回弹瞬间露出。
// 深色区块自己声明 `data-overscroll-dark`（如首页 Work 区、项目详情深色区），
// 本组件用 IntersectionObserver 观察这些区块：只要有深色区块在视口内，
// 就把 body 背景切成深色，避免在深色区底部回弹时闪出浅色。
// 没有标记的页面（全浅色结尾）什么都不做。
export function OverscrollBackground() {
  const pathname = usePathname();

  useEffect(() => {
    const targets = document.querySelectorAll("[data-overscroll-dark]");
    if (!targets.length) return;

    const visible = new Set<Element>();

    const applyBackground = () => {
      const dark = visible.size > 0;
      const color = dark ? "hsl(var(--color-bg-dark))" : "";
      document.documentElement.style.backgroundColor = color;
      document.body.style.backgroundColor = color;
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      }
      applyBackground();
    });

    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, [pathname]);

  return null;
}
