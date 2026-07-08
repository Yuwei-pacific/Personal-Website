"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
import { gsap } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import "./masonry.css";

export type MasonryItem = {
  id: string;
  img: string;
  height: number;
  width?: number;
  alt?: string;
  url?: string;
};

export type MasonryAnimateFrom = "top" | "bottom" | "left" | "right" | "center" | "random";

export type MasonryProps = {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: MasonryAnimateFrom;
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
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

type MeasuredSize = {
  width: number;
  height: number;
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

const useMeasure = (): [RefObject<HTMLDivElement | null>, MeasuredSize] => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<MeasuredSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;

      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
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
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
  preloadCount = 8,
  onItemClick,
}: MasonryProps) {
  const columns = useMedia<number>(COLUMN_QUERIES, COLUMN_VALUES, 1);
  const [containerRef, { width }] = useMeasure();
  const [inView, setInView] = useState(false);
  const hasMounted = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const preloadUrls = useMemo(() => items.slice(0, preloadCount).map((item) => item.img), [items, preloadCount]);
  const preloadKey = useMemo(() => preloadUrls.join("\u0000"), [preloadUrls]);
  const [readyPreloadKey, setReadyPreloadKey] = useState<string | null>(null);
  const imagesReady = readyPreloadKey === preloadKey;

  const getInitialPosition = useCallback(
    (item: MasonryGridItem) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return { x: item.x, y: item.y };

      let direction = animateFrom;

      if (animateFrom === "random") {
        const directions: Exclude<MasonryAnimateFrom, "random">[] = ["top", "bottom", "left", "right"];
        direction = directions[Math.floor(Math.random() * directions.length)] ?? "bottom";
      }

      switch (direction) {
        case "top":
          return { x: item.x, y: -200 };
        case "bottom":
          return { x: item.x, y: window.innerHeight + 200 };
        case "left":
          return { x: -200, y: item.y };
        case "right":
          return { x: window.innerWidth + 200, y: item.y };
        case "center":
          return {
            x: containerRect.width / 2 - item.w / 2,
            y: containerRect.height / 2 - item.h / 2,
          };
        default:
          return { x: item.x, y: item.y + 100 };
      }
    },
    [animateFrom, containerRef]
  );

  useEffect(() => {
    let active = true;

    preloadImages(preloadUrls).then(() => {
      if (active) setReadyPreloadKey(preloadKey);
    });

    return () => {
      active = false;
    };
  }, [preloadKey, preloadUrls]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

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
    if (!imagesReady || !inView) return;

    grid.forEach((item, index) => {
      const selector = dataKeySelector(item.id);
      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      if (prefersReducedMotion) {
        gsap.set(selector, { opacity: 1, ...animationProps });
        return;
      }

      if (!hasMounted.current) {
        const initialPosition = getInitialPosition(item);
        const initialState = {
          opacity: 0,
          x: initialPosition.x,
          y: initialPosition.y,
          width: item.w,
          height: item.h,
          ...(blurToFocus && { filter: "blur(10px)" }),
        };

        gsap.fromTo(selector, initialState, {
          opacity: 1,
          ...animationProps,
          ...(blurToFocus && { filter: "blur(0px)" }),
          duration: 0.8,
          ease: "power3.out",
          delay: index * stagger,
        });
      } else {
        gsap.to(selector, {
          ...animationProps,
          duration,
          ease,
          overwrite: "auto",
        });
      }
    });

    hasMounted.current = true;
  }, [blurToFocus, duration, ease, getInitialPosition, grid, imagesReady, inView, prefersReducedMotion, stagger]);

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
