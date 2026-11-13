"use client";

// 封面共享过渡：首页卡片封面 / 「下一个项目」缩略图 → 详情页封面。
// 靠 View Transitions 的同名元素配对实现（路由切换本身已由 next-view-transitions 包了
// startViewTransition）。两条规则保证不出错：
// 1. 同一页面上同名元素只能有一个，否则浏览器会直接放弃整次过渡 ——
//    所以来源一侧不常驻命名，只在被点击的那一刻认领名字。
// 2. 详情页封面只在入场的短时间内持有名字，之后释放 —— 常驻命名的元素在每次
//    路由过渡里都会被提成独立图层，盖在固定导航之上。
import { useEffect, useRef, type ReactNode } from "react";

const COVER_TRANSITION_NAME = "project-cover";
// 入场后保留名字的时长：略长于过渡本身（见 globals.css 的 project-cover 时长）
const RELEASE_AFTER_MS = 900;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 点击跳转前调用：让 source 成为本次过渡里封面的起点。减弱动画时不认领，退回普通淡入淡出。 */
export function claimCoverTransition(source: HTMLElement | null) {
  if (!source || prefersReducedMotion()) return;

  document
    .querySelectorAll<HTMLElement>("[data-cover-transition]")
    .forEach((element) => {
      element.style.viewTransitionName = "none";
    });
  source.style.viewTransitionName = COVER_TRANSITION_NAME;
}

/** 详情页封面容器：过渡的终点 */
export function CoverTransitionTarget({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (ref.current) ref.current.style.viewTransitionName = "none";
    }, RELEASE_AFTER_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div
      ref={ref}
      data-cover-transition
      data-overscroll-dark
      className={className}
      style={{ viewTransitionName: COVER_TRANSITION_NAME }}
    >
      {children}
    </div>
  );
}
