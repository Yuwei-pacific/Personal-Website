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
  /** 墨芯里显出的图像（可选），坐标同上 */
  drawImage?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** 参数；reveal 的坐标也按盒子算 */
  params: InkParams;
  /**
   * 窗口模式：盒子很高时（整个作品区），画布只有视口那么高、贴住视口（sticky），
   * 按滚动位置画出盒子里正在看的那一段。只用于 padding 为 0 的盒子
   */
  windowed?: boolean;
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
  focus,
  video,
  paused = false,
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
  /** 当前焦点：params.focusRegions 里第几个完整化开；-1 = 都收拢。不传 = 不用焦点 */
  focus?: number;
  /** 暂停：不再每帧画（如目录预览淡出之后）。画布保留最后一帧，渲染器与纹理都留着，恢复时不用重建 */
  paused?: boolean;
  /** 化开时在墨芯里播放的视频与它所占的区域（盒子坐标，CSS px）；element 为 null = 淡回静止封面 */
  video?: { element: HTMLVideoElement | null; rect?: { x: number; y: number; width: number; height: number } };
  fallback: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<InkRenderer | null>(null);
  const buildRef = useRef(build);
  const watchRef = useRef(watch);
  const [padding, setPadding] = useState<Padding>(ZERO);
  // 窗口模式下画布的高度（CSS px）；null = 普通模式，画布铺满盒子
  const [windowHeight, setWindowHeight] = useState<number | null>(null);
  const failed = !useInkSupported();
  const { theme } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  const pausedRef = useRef(paused);
  const visibilityRef = useRef<() => void>(() => {});

  useEffect(() => {
    buildRef.current = build;
    watchRef.current = watch;
  });

  useEffect(() => {
    pausedRef.current = paused;
    visibilityRef.current();
  }, [paused]);

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
    rendererRef.current?.setTables(theme === "dark" ? tables.dark : tables.light, theme === "dark");
  }, [theme, tables]);

  // 尺寸：盒子（或被 watch 的元素）变了才重画源图、重算模糊（这一步较贵）
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let frame = 0;
    let last = "";
    let cancelled = false;
    // 窗口模式的画布高度：取见过的最大视口高度。手机上地址栏收起 / 展开会让视口高度来回变，
    // 若跟着变就会在滚动途中反复重算整块区块的模糊（卡顿）；画布比可见部分略高没有关系
    let windowed = false;
    let viewport = 0;

    const update = () => {
      frame = 0;
      const renderer = rendererRef.current;
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!renderer || width < 1 || height < 1) return;
      const boxRect = box.getBoundingClientRect();
      const watched = (watchRef.current?.(box) ?? []).filter((el): el is Element => Boolean(el));
      viewport = Math.max(viewport, window.innerHeight);
      const key = [`${width}x${height}`, windowed ? viewport : "", buildKey, ...watched.map((el) => rectKey(el, boxRect))].join(
        ":",
      );
      if (key === last) return;
      last = key;

      const spec = buildRef.current(width, height, box);
      const { top, right, bottom, left } = spec.padding;
      setPadding(spec.padding);
      windowed = Boolean(spec.windowed);
      const view = windowed ? Math.min(viewport, height) : null;
      setWindowHeight(view);
      const reveal = spec.params.reveal;
      const { drawCore, drawImage } = spec;
      renderer.setLayout({
        width: width + left + right,
        height: height + top + bottom,
        window: view === null ? undefined : { height: view },
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
        drawImage: drawImage
          ? (ctx) => {
              ctx.translate(left, top);
              drawImage(ctx, width, height);
            }
          : undefined,
        params: {
          ...spec.params,
          reveal: reveal ? { ...reveal, x: reveal.x + left, y: reveal.y + top } : null,
          focusRegions: spec.params.focusRegions?.map((r) => ({ ...r, x: r.x + left, y: r.y + top })),
          flowDrops: spec.params.flowDrops?.map((d) => ({ x: d.x + left, y: d.y + top })),
        },
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    window.addEventListener("resize", schedule);
    (watchRef.current?.(box) ?? []).forEach((el) => el && observer.observe(el));
    // 字体加载完后，被 watch 的元素可能只是挪了位置（上面的文字变高了），尺寸没变
    document.fonts.ready.then(() => {
      if (!cancelled) schedule();
    });
    schedule();
    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [buildKey, failed]);

  // 焦点切换（作品区：滚到哪个作品，哪个作品化开）
  useEffect(() => {
    if (focus !== undefined) rendererRef.current?.setFocus(focus);
  }, [focus]);

  // 视频：只在化开的那一处播放
  const videoElement = video?.element ?? null;
  const videoRect = video?.rect;
  useEffect(() => {
    if (video === undefined) return;
    rendererRef.current?.setVideo(
      videoElement,
      videoRect && { ...videoRect, x: videoRect.x + padding.left, y: videoRect.y + padding.top },
    );
    // videoRect 每次渲染都是新对象：按数值比较，避免每帧重设
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoElement, videoRect?.x, videoRect?.y, videoRect?.width, videoRect?.height, padding.left, padding.top]);

  // 开始渲染；减弱动画时只画静止的一帧
  useEffect(() => {
    rendererRef.current?.start(!reducedMotion);
  }, [reducedMotion]);

  // 看不见就不画：滚出视口，或者被后面的纸整个盖住。
  // 叠纸（position: sticky 的区块，现在没有页面在用，但这个判断留着）：往下滚时首屏那张纸其实一直贴在视口顶上、
  // 只是被后面的纸盖住了。IntersectionObserver 只看位置，会以为它还看得见 —— 于是首屏和作品区
  // 两块画布每帧都在画，帧率掉到八十几。所以滚动时再看一眼：盒子可见部分的几个点上，
  // 最上层的元素是否还在盒子所在的区块里（画布是 pointer-events: none，elementFromPoint 会穿过它）。
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let intersecting = false;
    let frame = 0;

    const covered = () => {
      // 以盒子所在的 <section> 为准：悬停预览这类盒子的直接父元素本身也是 pointer-events: none
      const section = box.closest("section") ?? box.parentElement;
      if (!section) return false;
      const r = box.getBoundingClientRect();
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, window.innerHeight);
      if (bottom <= top) return false;
      const x = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
      return [0.15, 0.5, 0.85].every((k) => {
        const hit = document.elementFromPoint(x, top + (bottom - top) * k);
        return hit !== null && !section.contains(hit);
      });
    };
    const update = () => {
      frame = 0;
      rendererRef.current?.setVisible(intersecting && !pausedRef.current && !covered());
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    visibilityRef.current = schedule;

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        schedule();
      },
      { rootMargin: "120px" },
    );
    observer.observe(box);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
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
          className={windowHeight === null ? "absolute block" : "sticky top-0 block w-full"}
          style={
            windowHeight === null
              ? {
                  top: -padding.top,
                  left: -padding.left,
                  width: `calc(100% + ${padding.left + padding.right}px)`,
                  height: `calc(100% + ${padding.top + padding.bottom}px)`,
                }
              : { height: windowHeight }
          }
        />
      )}
    </div>
  );
}
