"use client";

// 进入项目的过场：一滩墨从点下去的地方漫开、铺满屏幕，换好页面后墨淡去。
// 取代之前的「封面共享过渡」（封面从首页的位置滑到内页的位置）—— 用户不喜欢封面划过来的样子
// （2026-11-16），要一个和墨有关的动画。
//
// 做法：一个固定在视口上的浮层，里面是一个 SVG 墨团（不规则的轮廓，外面依次是 Cobalt、Cyan、Amber、
// Coral 四道彩边 —— 五色的顺序和化开的晕一样）。墨团靠 SVG 内部的 transform 放大，彩边用
// non-scaling-stroke：墨团再大，边也只有固定的十几个 px 宽。（放大必须在 SVG 里面做：用 CSS transform
// 放大整个 <svg> 的话 non-scaling-stroke 不起作用，彩边会跟着变成几十 px 宽的彩虹条 —— 第一版就是这样。）
// 整层再加一点 CSS 模糊，四道色带融成一道晕，墨芯的边也是软的。
// 墨团的芯用页面的底色：浅色模式是纸色，深色模式是墨色 —— 和打开后的页面同一个底，墨淡去时接得上。
// 第一版用的是文字色（浅色模式黑芯、深色模式白芯）：屏幕先整个翻成反色再翻回来，像闪光弹（用户 2026-11-16）。
// 所以看得见的其实是那一圈五色的晕往外推，推过去的地方变成一张干净的纸。
//
// 流程：点击 → 墨漫开（约 0.55 秒）→ 铺满后才换路由 → 新页面就位（pathname 变了）→ 墨淡去。
// 换路由用普通的 router.push，不走 View Transition：屏幕这时整个被墨盖着，没有东西需要过渡。
//
// 不做过场、直接跳转的情况：减弱动画；带修饰键的点击（新标签页打开）；浮层还没挂上。
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type MouseEvent } from "react";

import { gsap, prefersReducedMotion } from "@/lib/animation/gsap-react";

// 墨团的轮廓：半径 50 的圆上叠几道起伏（viewBox 单位）
const BLOB = (() => {
  const steps = 72;
  const points: string[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = 50 * (1 + 0.06 * Math.sin(a * 2 + 0.7) + 0.045 * Math.sin(a * 3 + 2.3) + 0.03 * Math.sin(a * 5 + 4.2));
    points.push(`${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${points.join("L")}Z`;
})();
// 墨团在 scale = 1 时的直径（CSS px）
const BASE = 100;
// 彩边：由外到内画，后画的盖住先画的；宽度是整道描边的宽度（一半在轮廓外面，所以晕约 15px 宽）
const RIM = [
  { color: "#FF5A4E", width: 30 },
  { color: "#FF9A1F", width: 22 },
  { color: "#35C2D8", width: 14 },
  { color: "#1B3FD6", width: 7 },
] as const;
// 整层的模糊（CSS px）：把四道色带融成一道晕
const SOFTEN = 3;
const SPREAD = 0.55;
const FADE = 0.45;
// 新页面迟迟不来（网络断了）时，最多等这么久就把墨收走，不把人困在一屏墨里
const GIVE_UP_MS = 4000;

type Controller = { run: (x: number, y: number, size: number, navigate: () => void) => void };
let controller: Controller | null = null;

/** 浮层：整站挂一次（[locale]/layout.tsx） */
export function InkTransitionOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<SVGGElement>(null);
  const activeRef = useRef(false);
  const timeoutRef = useRef(0);
  const pathname = usePathname();

  const recede = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || !activeRef.current) return;
    activeRef.current = false;
    window.clearTimeout(timeoutRef.current);
    gsap.to(overlay, {
      opacity: 0,
      duration: FADE,
      delay: 0.12,
      ease: "power1.out",
      onComplete: () => {
        overlay.style.visibility = "hidden";
      },
    });
  }, []);

  useEffect(() => {
    controller = {
      run: (x, y, size, navigate) => {
        const overlay = overlayRef.current;
        const blob = blobRef.current;
        if (!overlay || !blob || activeRef.current) {
          navigate();
          return;
        }
        activeRef.current = true;
        // 铺满：墨团的最小半径（约 0.87 × 名义半径）要够到离落点最远的那个角
        const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const full = (reach / (BASE / 2) / 0.85) * 1.05;
        const state = { scale: Math.max(0.3, (size / BASE) * 0.5) };
        const apply = () => blob.setAttribute("transform", `translate(${x} ${y}) scale(${state.scale})`);
        gsap.killTweensOf(overlay);
        apply();
        gsap.set(overlay, { opacity: 1, visibility: "visible" });
        gsap.to(state, {
          scale: full,
          duration: SPREAD,
          ease: "power2.in",
          onUpdate: apply,
          onComplete: () => {
            navigate();
            timeoutRef.current = window.setTimeout(recede, GIVE_UP_MS);
          },
        });
      },
    };
    return () => {
      controller = null;
      window.clearTimeout(timeoutRef.current);
    };
  }, [recede]);

  // 新页面就位：墨淡去
  useEffect(() => {
    recede();
  }, [pathname, recede]);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-cursor overflow-hidden text-background"
      style={{ visibility: "hidden" }}
    >
      {/* 没有 viewBox：SVG 的单位就是 CSS px，墨团的位置和大小由 <g> 的 transform 定 */}
      <svg className="absolute inset-0 size-full" style={{ filter: `blur(${SOFTEN}px)` }}>
        <g ref={blobRef}>
          {RIM.map((band) => (
            <path
              key={band.color}
              d={BLOB}
              fill="none"
              stroke={band.color}
              strokeWidth={band.width}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={BLOB} fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}

/**
 * 给项目链接用：返回一个 onClick，点击时先让墨漫开再跳转。
 * origin 是墨落下的地方（比如封面占位）；不传就从点击的位置落下。
 */
export function useInkNavigate() {
  const router = useRouter();
  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string, origin?: Element | null) => {
      // 新标签页 / 新窗口 / 下载之类的点击，交还给浏览器
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!controller || prefersReducedMotion()) return;
      event.preventDefault();
      const rect = origin?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : event.clientX;
      const y = rect ? rect.top + rect.height / 2 : event.clientY;
      controller.run(x, y, rect ? Math.min(rect.width, rect.height) : BASE, () => router.push(href));
    },
    [router],
  );
}
