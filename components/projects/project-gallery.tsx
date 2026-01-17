"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

type GalleryItem = {
  url?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
};

type ProjectGalleryProps = {
  items?: GalleryItem[];
  title?: string;
  columns?: "2" | "3";
  fullWidth?: boolean;
};

export function ProjectGallery({ items, title = "Gallery", columns = "2", fullWidth }: ProjectGalleryProps) {
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isResettingOffset, setIsResettingOffset] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const dragInitialOffsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close modal handler
  const closeModal = useCallback(() => {
    setActive(null);
    setActiveIndex(-1);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (!items) return;
    const newIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    setActiveIndex(newIndex);
    setActive(items[newIndex]);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, [activeIndex, items]);

  const handleNext = useCallback(() => {
    if (!items) return;
    const newIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(newIndex);
    setActive(items[newIndex]);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, [activeIndex, items]);

  // Keyboard navigation
  useEffect(() => {
    if (!active || !items) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, items, closeModal, handlePrevious, handleNext]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (active) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [active]);

  // Wheel zoom handler (trackpad)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!active || !imageContainerRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      setZoom((z) => {
        // 使用指数计算使缩放更跟手，deltaY越大，缩放变化越大
        const scale = Math.exp(-e.deltaY * 0.001);
        const newZoom = z * scale;
        return Math.max(0.5, Math.min(3, newZoom));
      });
    };

    if (active) {
      window.addEventListener("wheel", handleWheel, { passive: false });
      return () => window.removeEventListener("wheel", handleWheel);
    }
  }, [active]);

  // Touch zoom handler (pinch on mobile)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!active || e.touches.length !== 2) {
        lastDistanceRef.current = null;
        return;
      }

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastDistanceRef.current = distance;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 2 || lastDistanceRef.current === null) return;

      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // 计算距离变化的增量，然后应用到缩放
      const scale = distance / lastDistanceRef.current;
      // 使用幂函数使缩放更线性和可控
      const zoomFactor = Math.pow(scale, 0.5);
      setZoom((z) => {
        const newZoom = z * zoomFactor;
        return Math.max(0.5, Math.min(3, newZoom));
      });

      lastDistanceRef.current = distance;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!active || e.touches.length !== 0) return;
      lastDistanceRef.current = null;
    };

    if (active) {
      window.addEventListener("touchstart", handleTouchStart, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd, { passive: true });
      return () => {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [active]);

  // Reset offset when zoom returns to normal
  useEffect(() => {
    if (zoom <= 1) {
      setIsResettingOffset(true);
      setOffsetX(0);
      setOffsetY(0);
      offsetXRef.current = 0;
      offsetYRef.current = 0;
      // Remove animation class after transition completes
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        setIsResettingOffset(false);
      }, 200);
    } else if (zoom > 1) {
      // When starting to zoom, immediately clear resetting state
      setIsResettingOffset(false);
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    }
  }, [zoom]);

  // Drag handler for moving zoomed image
  useEffect(() => {
    if (!imageContainerRef.current) return;

    const container = imageContainerRef.current;
    let pendingOffsetX = 0;
    let pendingOffsetY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (zoom <= 1) return;

      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      dragInitialOffsetRef.current = { x: offsetXRef.current, y: offsetYRef.current };
      pendingOffsetX = offsetXRef.current;
      pendingOffsetY = offsetYRef.current;
      container.style.cursor = "grabbing";
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (zoom <= 1 || e.touches.length !== 1) return;

      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragInitialOffsetRef.current = { x: offsetXRef.current, y: offsetYRef.current };
      pendingOffsetX = offsetXRef.current;
      pendingOffsetY = offsetYRef.current;
    };

    const updateOffset = () => {
      offsetXRef.current = pendingOffsetX;
      offsetYRef.current = pendingOffsetY;
      setOffsetX(pendingOffsetX);
      setOffsetY(pendingOffsetY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || zoom <= 1) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      pendingOffsetX = dragInitialOffsetRef.current.x + dx;
      pendingOffsetY = dragInitialOffsetRef.current.y + dy;

      // Cancel previous raf if exists
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Schedule update
      rafRef.current = requestAnimationFrame(updateOffset);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || zoom <= 1 || e.touches.length !== 1) return;

      e.preventDefault();

      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;

      pendingOffsetX = dragInitialOffsetRef.current.x + dx;
      pendingOffsetY = dragInitialOffsetRef.current.y + dy;

      // Cancel previous raf if exists
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Schedule update
      rafRef.current = requestAnimationFrame(updateOffset);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = zoom > 1 ? "grab" : "default";
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Final update
      offsetXRef.current = pendingOffsetX;
      offsetYRef.current = pendingOffsetY;
      setOffsetX(pendingOffsetX);
      setOffsetY(pendingOffsetY);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Final update
      offsetXRef.current = pendingOffsetX;
      offsetYRef.current = pendingOffsetY;
      setOffsetX(pendingOffsetX);
      setOffsetY(pendingOffsetY);
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [zoom]);

  if (!items?.length) return null;

  const handleImageClick = (item: GalleryItem, idx: number) => {
    setActive(item);
    setActiveIndex(idx);
    setZoom(1);
  };

  const gridColsClass = columns === "3"
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <section className={`space-y-4 ${fullWidth ? "w-screen -mx-4 px-4 sm:-mx-6 sm:px-6" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        {/* <p className="text-sm text-neutral-400">Click to view details • Use arrow keys to navigate • ESC to close</p> */}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className={`grid gap-2 ${gridColsClass}`}>
        {items.map((item, idx) => (
          <figure
            key={idx}
            className="overflow-hidden rounded-lg bg-neutral-900 group cursor-pointer hover:ring-2 hover:ring-emerald-500/60 transition-all"
          >
            {item.url && item.width && item.height && (
              <button
                type="button"
                onClick={() => handleImageClick(item, idx)}
                className="block w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                aria-label={`View ${item.alt || `image ${idx + 1}`}`}
              >
                <Image
                  src={item.url}
                  alt={item.alt || ""}
                  width={item.width}
                  height={item.height}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.08]"
                  sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  priority={idx < 2}
                />
              </button>
            )}
          </figure>
        ))}
      </div>

      {active && typeof window !== "undefined"
        ? createPortal(
          <div
            className="fixed inset-0 z-[9999] m-0 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 touch-none"
            onClick={closeModal}
            aria-modal="true"
            role="dialog"
            aria-label="Image gallery modal"
          >
            <div
              className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 rounded-full bg-black/50 px-2 py-1 text-white shadow hover:bg-black/70 transition-colors">
                  <button
                    type="button"
                    className="px-2 py-1 text-sm hover:bg-white/10 transition-colors"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    −
                  </button>
                  <span className="text-xs font-semibold min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm hover:bg-white/10 transition-colors"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs hover:bg-white/10 transition-colors"
                    onClick={() => setZoom(1)}
                    title="Reset zoom"
                    aria-label="Reset zoom"
                  >
                    ↺
                  </button>
                </div>
                <p className="text-sm text-white/80">{activeIndex + 1} / {items.length}</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full bg-black/50 hover:bg-black/70 text-white px-3 py-1 text-sm font-medium shadow transition-colors"
                  title="Close (ESC)"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Main Image */}
              <div
                ref={imageContainerRef}
                className="flex md:max-h-[90vh] max-h-[calc(100vh-200px)] items-center justify-center overflow-hidden bg-black/40 relative select-none"
                style={{
                  cursor: zoom > 1 ? "grab" : "default",
                }}
              >
                {active.url && active.width && active.height && (
                  <Image
                    src={active.url}
                    alt={active.alt || ""}
                    width={active.width}
                    height={active.height}
                    className={`h-full w-full origin-center object-contain pointer-events-none ${isResettingOffset ? "transition-transform duration-200" : ""
                      }`}
                    sizes="90vw"
                    priority
                    draggable={false}
                    style={{ transform: `scale(${zoom}) translate(${offsetX / zoom}px, ${offsetY / zoom}px)` }}
                  />
                )}
              </div>

              {/* Caption */}
              {active.caption && (
                <p className="bg-gradient-to-t from-black/50 to-transparent px-5 py-3 text-sm text-neutral-200 text-center">{active.caption}</p>
              )}

              {/* Navigation Buttons */}
              <button
                type="button"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white p-2 shadow transition-all hover:scale-110 hidden sm:flex items-center justify-center"
                title="Previous (←)"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white p-2 shadow transition-all hover:scale-110 hidden sm:flex items-center justify-center"
                title="Next (→)"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>,
          document.body
        )
        : null}
    </section>
  );
}