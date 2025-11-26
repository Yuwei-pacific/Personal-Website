"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
  const [zoom, setZoom] = useState(1);

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

  return (
    <section className={`space-y-4 ${fullWidth ? "w-screen -mx-4 px-4 sm:-mx-6 sm:px-6" : ""}`}>
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className={`columns-1 gap-5 ${columns === "3" ? "sm:columns-2 lg:columns-3" : "sm:columns-2"}`}>
        {items.map((item, idx) => (
          <figure
            key={idx}
            className="mb-5 break-inside-avoid overflow-hidden rounded-xl"
          >
            {item.url && item.width && item.height && (
              <button
                type="button"
                onClick={() => setActive(item)}
                className="block w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                <Image
                  src={item.url}
                  alt={item.alt || ""}
                  width={item.width}
                  height={item.height}
                  className="h-full w-full object-cover transition hover:scale-[1.02]"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
              className="fade-overlay fixed inset-0 z-[9999] m-0 flex items-center justify-center bg-black/90 backdrop-blur-sm p-0"
              onClick={() => setActive(null)}
              aria-modal="true"
              role="dialog"
            >
              <div
                className="zoom-card relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white shadow hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  Close
                </button>
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-2 py-1 text-white shadow">
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-sm font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  >
                    −
                  </button>
                  <span className="text-xs font-semibold">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-sm font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-xs font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    onClick={() => setZoom(1)}
                  >
                    Reset
                  </button>
                </div>
                {active.url && active.width && active.height && (
                  <div className="flex max-h-[92vh] items-center justify-center overflow-auto bg-black/40">
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
                  </div>
                )}
                {active.caption && (
                  <p className="px-5 py-3 text-sm text-neutral-200">{active.caption}</p>
                )}
              </div>
              <style jsx>{`
                @keyframes fadeInOverlay {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }
                @keyframes zoomPop {
                  from {
                    opacity: 0;
                    transform: scale(0.96);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
                .fade-overlay {
                  animation: fadeInOverlay 160ms ease-out;
                }
                .zoom-card {
                  animation: zoomPop 200ms ease-out;
                }
              `}</style>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
