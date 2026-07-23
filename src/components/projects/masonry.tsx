"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
import { gsap } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import "./masonry.css";

export type MasonryItem = {
  id: string;
  img: string;
  height: number;
  width?: number;
  alt?: string;
  url?: string;
};

export type MasonryProps = {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  scaleOnHover?: boolean;
  hoverScale?: number;
  colorShiftOnHover?: boolean;
  preloadCount?: number;
  onItemClick?: (item: MasonryItem, index: number) => void;
};

type MasonryGridItem = MasonryItem & {
  x: number;
  y: number;
  w: number;
  h: number;
};

const COLUMN_QUERIES = ["(min-width:1500px)", "(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"] as const;
const COLUMN_VALUES = [5, 4, 3, 2] as const;

const useMedia = <T,>(queries: readonly string[], values: readonly T[], defaultValue: T): T => {
  const getValue = useCallback(() => {
    if (typeof window === "undefined") return defaultValue;

    const index = queries.findIndex((query) => window.matchMedia(query).matches);
    return values[index] ?? defaultValue;
  }, [defaultValue, queries, values]);

  const [value, setValue] = useState<T>(getValue);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueries = queries.map((query) => window.matchMedia(query));
    const handleChange = () => setValue(getValue());

    handleChange();
    mediaQueries.forEach((query) => query.addEventListener("change", handleChange));

    return () => {
      mediaQueries.forEach((query) => query.removeEventListener("change", handleChange));
    };
  }, [getValue, queries]);

  return value;
};

const useMeasure = (): [RefObject<HTMLDivElement | null>, number] => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;

      const nextWidth = entry.contentRect.width;
      setWidth((currentWidth) => currentWidth === nextWidth ? currentWidth : nextWidth);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
};

const preloadImages = async (urls: string[]) => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        })
    )
  );
};

const dataKeySelector = (id: string) => `[data-key="${id.replace(/["\\]/g, "\\$&")}"]`;

export function Masonry({
  items,
  ease = "power3.out",
  duration = 0.6,
  scaleOnHover = true,
  hoverScale = 0.95,
  colorShiftOnHover = false,
  preloadCount = 8,
  onItemClick,
}: MasonryProps) {
  const columns = useMedia<number>(COLUMN_QUERIES, COLUMN_VALUES, 1);
  const [containerRef, width] = useMeasure();
  const hasMounted = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const preloadUrls = useMemo(() => items.slice(0, preloadCount).map((item) => item.img), [items, preloadCount]);
  const preloadKey = useMemo(() => preloadUrls.join("\u0000"), [preloadUrls]);
  const [readyPreloadKey, setReadyPreloadKey] = useState<string | null>(null);
  const imagesReady = readyPreloadKey === preloadKey;

  useEffect(() => {
    let active = true;

    preloadImages(preloadUrls).then(() => {
      if (active) setReadyPreloadKey(preloadKey);
    });

    return () => {
      active = false;
    };
  }, [preloadKey, preloadUrls]);

  const { grid, containerHeight } = useMemo(() => {
    if (!width) return { grid: [] as MasonryGridItem[], containerHeight: 0 };

    const columnHeights = Array.from({ length: columns }, () => 0);
    const columnWidth = width / columns;

    const gridItems = items.map((item) => {
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const x = columnWidth * column;
      const height = item.width ? (columnWidth * item.height) / item.width : item.height / 2;
      const y = columnHeights[column] ?? 0;

      columnHeights[column] = y + height;

      return { ...item, x, y, w: columnWidth, h: height };
    });

    return { grid: gridItems, containerHeight: Math.max(...columnHeights, 0) };
  }, [columns, items, width]);

  useLayoutEffect(() => {
    // grid 为空（容器宽度未测出）时不能标记 hasMounted，
    // 否则首次真正布局会走补间分支、永远不写 opacity
    if (!imagesReady || !grid.length) return;

    // 入场不做动画：首次布局（以及 reduced-motion 下的任何布局）直接定位显示；
    // 之后的布局变化（容器缩放、断点换列）仍用补间过渡
    grid.forEach((item) => {
      const selector = dataKeySelector(item.id);
      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      if (prefersReducedMotion || !hasMounted.current) {
        gsap.set(selector, { opacity: 1, ...animationProps });
        return;
      }

      gsap.to(selector, {
        ...animationProps,
        duration,
        ease,
        overwrite: "auto",
      });
    });

    hasMounted.current = true;
  }, [duration, ease, grid, imagesReady, prefersReducedMotion]);

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>, item: MasonryGridItem) => {
    if (prefersReducedMotion) return;

    const selector = dataKeySelector(item.id);

    if (scaleOnHover) {
      gsap.to(selector, {
        scale: hoverScale,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (colorShiftOnHover) {
      const overlay = event.currentTarget.querySelector<HTMLElement>(".color-overlay");
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0.3,
          duration: 0.3,
        });
      }
    }
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>, item: MasonryGridItem) => {
    if (prefersReducedMotion) return;

    const selector = dataKeySelector(item.id);

    if (scaleOnHover) {
      gsap.to(selector, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (colorShiftOnHover) {
      const overlay = event.currentTarget.querySelector<HTMLElement>(".color-overlay");
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3,
        });
      }
    }
  };

  const handleClick = (item: MasonryGridItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
      return;
    }

    if (item.url) {
      window.open(item.url, "_blank", "noopener");
    }
  };

  return (
    <div ref={containerRef} className="masonry-list" style={{ height: containerHeight || undefined }}>
      {grid.map((item, index) => (
        <button
          key={item.id}
          type="button"
          data-key={item.id}
          className="masonry-item"
          aria-label={item.alt || `View image ${index + 1}`}
          onClick={() => handleClick(item, index)}
          onMouseEnter={(event) => handleMouseEnter(event, item)}
          onMouseLeave={(event) => handleMouseLeave(event, item)}
        >
          <div className="masonry-item-img" style={{ backgroundImage: `url(${item.img})` }}>
            {colorShiftOnHover && (
              <div
                className="color-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(45deg, rgba(255,0,150,0.5), rgba(0,150,255,0.5))",
                  opacity: 0,
                  pointerEvents: "none",
                  borderRadius: "8px",
                }}
              />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default Masonry;
