"use client";

// lightbox 打开期间要做的两件事，画廊和正文图片的放大共用：
// - 暂停 Lenis：它虚拟化了滚轮事件，lightbox 自带的 overflow 锁滚对它无效，
//   不停掉的话滚轮缩放图片时背景页面会跟着滚
// - 把画布换成墨色：锁滚动时滚动条消失，globals.css 里常驻的 scrollbar-gutter 会在右侧
//   留下一条空槽，露出 html 的浅色画布底 —— 紧挨着深色 lightbox 会看见一条白边。
//   lightbox 在两种主题下都是深色，所以期间统一用墨色，关闭时还原。
import { useEffect } from "react";
import { useLenis } from "lenis/react";

export function useLightboxLock(open: boolean) {
  const lenis = useLenis();

  useEffect(() => {
    if (!open) return;

    lenis?.stop();

    const html = document.documentElement;
    const previousBackground = html.style.backgroundColor;
    html.style.backgroundColor = "hsl(var(--color-ink))";

    return () => {
      lenis?.start();
      html.style.backgroundColor = previousBackground;
    };
  }, [open, lenis]);
}
