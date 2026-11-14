// 不是客户端入口：只由 ink-mark.tsx（"use client"）引入，props 里有函数。
// 一块化开的画布：负责尺寸、主题、可见性、减弱动画，把形状和参数交给 InkRenderer（ink-gl.ts）。
//
// 盒子（外层 div）就是排版用的那个框 —— 标志是墨迹的框、单词是字形的框。
// 晕画在盒子外面：画布比盒子四周各大出 padding，用负的定位偏出去。所以排版时直接按盒子对齐。
// 首屏那块画布铺满整个首屏（padding 为 0），形状按页面里几个占位元素的位置画（见 watch）。
//
// 浏览器不支持 WebGL2 时显示 fallback（静态的 SVG 版本）。
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

import { InkRenderer, type InkParams } from "./ink-gl";
import type { InkTables } from "./ink-tables";

export type Padding = { top: number; right: number; bottom: number; left: number };

export type InkSpec = {
  /** 盒子四周给晕留的余量（CSS px） */
  padding: Padding;
  /** 把形状画进源图：坐标原点在盒子左上角、单位 CSS px，墨用黑色 */
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** 必须保留一丝墨芯的细形状（可选），坐标同上 */
  drawCore?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** 参数；reveal 的坐标也按盒子算 */
  params: InkParams;
};

const ZERO: Padding = { top: 0, right: 0, bottom: 0, left: 0 };

// 浏览器是否支持 WebGL2：只探测一次。服务端渲染时先按支持处理（输出画布）
let webglSupport: boolean | null = null;
const supportsWebGL2 = () => {
  if (webglSupport === null) {
    try {
      webglSupport = Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
};
const noopSubscribe = () => () => {};

/** 能否用 WebGL 渲染；不能时各处改显示 SVG 兜底 */
export function useInkSupported() {
  return useSyncExternalStore(noopSubscribe, supportsWebGL2, () => true);
}

// 元素相对盒子的位置与尺寸，取整后拼成字符串：变了才重算
function rectKey(element: Element, box: DOMRect) {
  const r = element.getBoundingClientRect();
  return [r.left - box.left, r.top - box.top, r.width, r.height].map(Math.round).join(",");
}

export function InkSurface({
  className,
  style,
  label,
  tables,
  build,
  buildKey,
  watch,
  fallback,
}: {
  className?: string;
  style?: CSSProperties;
  /** 给读屏的名称；纯装饰时不传 */
  label?: string;
  tables: { light: InkTables; dark: InkTables };
  /** 按盒子的实际尺寸给出形状与参数。内容变化时改 buildKey，触发重算 */
  build: (width: number, height: number, box: HTMLElement) => InkSpec;
  buildKey: string;
  /** 形状还取决于页面里别的元素（占位）时：返回这些元素，它们的尺寸或位置变了也会重算 */
  watch?: (box: HTMLElement) => (Element | null)[];
  fallback: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<InkRenderer | null>(null);
  const buildRef = useRef(build);
  const watchRef = useRef(watch);
  const [padding, setPadding] = useState<Padding>(ZERO);
  const failed = !useInkSupported();
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    buildRef.current = build;
    watchRef.current = watch;
  });

  // 渲染器只建一次（不支持时画布不存在，这里什么也不做）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 支持探测通过但着色器仍编译失败的极少数情况：画布留空（与显影前一样），不再退回
    const renderer = InkRenderer.create(canvas);
    if (!renderer) return;
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [failed]);

  // 主题：只换查找表
  useEffect(() => {
    rendererRef.current?.setTables(theme === "dark" ? tables.dark : tables.light);
  }, [theme, tables]);

  // 尺寸：盒子（或被 watch 的元素）变了才重画源图、重算模糊（这一步较贵）
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let frame = 0;
    let last = "";
    let cancelled = false;

    const update = () => {
      frame = 0;
      const renderer = rendererRef.current;
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!renderer || width < 1 || height < 1) return;
      const boxRect = box.getBoundingClientRect();
      const watched = (watchRef.current?.(box) ?? []).filter((el): el is Element => Boolean(el));
      const key = [`${width}x${height}`, buildKey, ...watched.map((el) => rectKey(el, boxRect))].join(":");
      if (key === last) return;
      last = key;

      const spec = buildRef.current(width, height, box);
      const { top, right, bottom, left } = spec.padding;
      setPadding(spec.padding);
      const reveal = spec.params.reveal;
      const { drawCore } = spec;
      renderer.setLayout({
        width: width + left + right,
        height: height + top + bottom,
        draw: (ctx) => {
          ctx.translate(left, top);
          spec.draw(ctx, width, height);
        },
        drawCore: drawCore
          ? (ctx) => {
              ctx.translate(left, top);
              drawCore(ctx, width, height);
            }
          : undefined,
        params: {
          ...spec.params,
          reveal: reveal ? { ...reveal, x: reveal.x + left, y: reveal.y + top } : null,
        },
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    (watchRef.current?.(box) ?? []).forEach((el) => el && observer.observe(el));
    // 字体加载完后，被 watch 的元素可能只是挪了位置（上面的文字变高了），尺寸没变
    document.fonts.ready.then(() => {
      if (!cancelled) schedule();
    });
    schedule();
    return () => {
      cancelled = true;
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [buildKey, failed]);

  // 开始渲染；减弱动画时只画静止的一帧
  useEffect(() => {
    rendererRef.current?.start(!reducedMotion);
  }, [reducedMotion]);

  // 滚出视口就不画
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new IntersectionObserver(
      ([entry]) => rendererRef.current?.setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("pointer-events-none relative select-none", className)}
      style={style}
    >
      {failed ? (
        fallback
      ) : (
        <canvas
          ref={canvasRef}
          className="absolute block"
          style={{
            top: -padding.top,
            left: -padding.left,
            width: `calc(100% + ${padding.left + padding.right}px)`,
            height: `calc(100% + ${padding.top + padding.bottom}px)`,
          }}
        />
      )}
    </div>
  );
}
