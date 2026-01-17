"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
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

  useEffect(() => {
    if (!active || !items) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setActiveIndex(-1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const newIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
        setActiveIndex(newIndex);
        setActive(items[newIndex]);
        setZoom(1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const newIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
        setActiveIndex(newIndex);
        setActive(items[newIndex]);
        setZoom(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, activeIndex, items]);

  useEffect(() => {
    if (active) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [active]);

  if (!items?.length) return null;

  const handleImageClick = (item: GalleryItem, idx: number) => {
    setActive(item);
    setActiveIndex(idx);
    setZoom(1);
  };

  const handlePrevious = useCallback(() => {
    const newIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    setActiveIndex(newIndex);
    setActive(items[newIndex]);
    setZoom(1);
  }, [activeIndex, items]);

  const handleNext = useCallback(() => {
    const newIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(newIndex);
    setActive(items[newIndex]);
    setZoom(1);
  }, [activeIndex, items]);

  const gridColsClass = columns === "3"
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className={`space-y-4 ${fullWidth ? "w-screen -mx-4 px-4 sm:-mx-6 sm:px-6" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-neutral-400">Click to view details • Use arrow keys to navigate • ESC to close</p>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className={`grid gap-3 ${gridColsClass}`}>
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
              >
                <Image
                  src={item.url}
                  alt={item.alt || ""}
                  width={item.width}
                  height={item.height}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.08]"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  priority={idx < 2}
                />
              </button>
            )}
          </figure>
        ))}
      </div>

      {active
        ? createPortal(
          <div
            className="fixed inset-0 z-[9999] m-0 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => {
              setActive(null);
              setActiveIndex(-1);
            }}
            aria-modal="true"
            role="dialog"
          >
            <div
              className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
                <div className="flex-1" />
                <p className="text-sm text-white/80">{activeIndex + 1} / {items.length}</p>
                <button
                  type="button"
                  onClick={() => {
                    setActive(null);
                    setActiveIndex(-1);
                  }}
                  className="rounded-full bg-black/50 hover:bg-black/70 text-white px-3 py-1 ml-4 text-sm font-medium shadow transition-colors"
                  title="Close (ESC)"
                >
                  ✕
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="absolute left-4 top-16 flex items-center gap-2 rounded-full bg-black/50 px-2 py-1 text-white shadow hover:bg-black/70 transition-colors z-10">
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-white/10 transition-colors"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  title="Zoom out"
                >
                  −
                </button>
                <span className="text-xs font-semibold min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-white/10 transition-colors"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs hover:bg-white/10 transition-colors"
                  onClick={() => setZoom(1)}
                  title="Reset"
                >
                  ↺
                </button>
              </div>

              {/* Main Image */}
              <div className="flex max-h-[90vh] items-center justify-center overflow-auto bg-black/40 relative">
                {active.url && active.width && active.height && (
                  <Image
                    src={active.url}
                    alt={active.alt || ""}
                    width={active.width}
                    height={active.height}
                    className="h-full w-full origin-center object-contain transition-transform duration-200"
                    sizes="90vw"
                    priority
                    style={{ transform: `scale(${zoom})` }}
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
