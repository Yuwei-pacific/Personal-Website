"use client";

// 图片画廊组件：支持点击放大、拖拽移动、滚轮/双指缩放、键盘导航
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

// 画廊图片条目类型：包含 URL、替代文本、说明及尺寸
type GalleryItem = {
  url?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
};

// 组件入参：
// - items：图片列表
// - title：标题文案
// - columns：网格列数（2/3）
// - fullWidth：是否整屏宽度展示
type ProjectGalleryProps = {
  items?: GalleryItem[];
  title?: string;
  columns?: "2" | "3";
  fullWidth?: boolean;
};

export function ProjectGallery({ items, title = "Gallery", columns = "2", fullWidth }: ProjectGalleryProps) {
  // 模态状态：当前激活图片与索引
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  // 交互状态：缩放比例与平移偏移量
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  // 是否处于“自动回中心”的过渡动画状态
  const [isResettingOffset, setIsResettingOffset] = useState(false);
  // 容器与交互辅助引用：避免闭包导致的值不更新
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
  // 关闭模态：重置状态与位置
  const closeModal = useCallback(() => {
    setActive(null);
    setActiveIndex(-1);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  // Navigation handlers
  // 上一张：循环到最后一张，始终重置缩放与偏移
  const handlePrevious = useCallback(() => {
    if (!items) return;
    const newIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    setActiveIndex(newIndex);
    setActive(items[newIndex]);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, [activeIndex, items]);

  // 下一张：循环到第一张，始终重置缩放与偏移
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
  // 键盘导航：Esc 关闭、左右方向键切换
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
  // 打开模态时禁用 body 滚动，关闭后恢复
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
  // 触控板/滚轮缩放：指数缩放更跟手；可根据体验调整系数
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
  // 双指缩放：根据两指距离变化计算缩放比例，并用幂函数平滑处理
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
  // 缩放回到 ≤1 时自动将偏移恢复到中心，并短暂启用过渡动画
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
  // 拖拽处理：使用 requestAnimationFrame 合并更新，避免频繁重渲染；通过 ref 保存最新偏移
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

  // 点击缩略图打开模态并重置缩放
  const handleImageClick = (item: GalleryItem, idx: number) => {
    setActive(item);
    setActiveIndex(idx);
    setZoom(1);
  };

  // 网格列数：在不同断点下的响应式列数
  const gridColsClass = columns === "3"
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <section className={`space-y-4 ${fullWidth ? "w-full" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        {/* 交互提示：点击查看详情、方向键切换、ESC关闭（如需显示可取消注释）*/}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className={`grid gap-3 ${gridColsClass}`}>
        {items.map((item, idx) => (
          <figure
            key={idx}
            className="relative overflow-hidden rounded-lg bg-neutral-900 group cursor-pointer hover:ring-2 hover:ring-emerald-500/60 transition-all"
            style={{
              aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : undefined,
            }}
          >
            {item.url && item.width && item.height && (
              <button
                type="button"
                onClick={() => handleImageClick(item, idx)}
                className="relative block w-full h-full focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                aria-label={`View ${item.alt || `image ${idx + 1}`}`}
              >
                <Image
                  src={item.url}
                  alt={item.alt || ""}
                  width={item.width}
                  height={item.height}
                  className="w-full h-full object-contain transition duration-300 group-hover:scale-[1.01] bg-neutral-950"
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
              className="relative flex h-[90vh] max-h-[90vh] flex-col w-full max-w-6xl overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              {/* 顶部工具栏：缩放控制、进度显示与关闭按钮 */}
              <div className="flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
                {/* Zoom Controls */}
                {/* 缩放按钮：-、+、重置 */}
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
              {/* 主图区域：缩放与偏移通过 transform 控制；拖拽绑定在容器上 */}
              <div
                ref={imageContainerRef}
                className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-black/40 select-none p-3"
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
                    className={`h-full w-full max-h-full max-w-full origin-center object-contain pointer-events-none ${isResettingOffset ? "transition-transform duration-200" : ""
                      }`}
                    sizes="90vw"
                    priority
                    draggable={false}
                    style={{ transform: `scale(${zoom}) translate(${offsetX / zoom}px, ${offsetY / zoom}px)` }}
                  />
                )}
              </div>

              {/* Caption */}
              {/* 图片说明：在底部渐变背景上居中显示 */}
              {active.caption && (
                <p className="bg-gradient-to-t from-black/50 to-transparent px-5 py-3 text-sm text-neutral-200 text-center">{active.caption}</p>
              )}

              {/* Navigation Buttons */}
              {/* 左右导航按钮：显示在中线两侧，支持悬停放大 */}
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