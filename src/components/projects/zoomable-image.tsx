"use client";

// 正文里可点开放大的图片：外面包一个按钮，点了才加载 lightbox（见 image-lightbox.tsx）。
// 图表和界面截图在版面里按阅读尺寸排，细节靠点开看 —— 不必为了看清小字把图撑成通栏。
import dynamic from "next/dynamic";
import { useRef, useState, type ReactNode } from "react";

import type { ZoomSource } from "./image-lightbox";

const ImageLightbox = dynamic(() => import("./image-lightbox"), { ssr: false });

export function ZoomableImage({
  source,
  label,
  children,
}: {
  source: ZoomSource;
  /** 按钮的可读名称前缀（「查看图片」），后面接图片的 alt */
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={source.alt ? `${label}: ${source.alt}` : label}
        className="block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-design-dark-bg"
      >
        {children}
      </button>
      {open ? (
        <ImageLightbox
          source={source}
          onClose={() => {
            setOpen(false);
            // 关掉后焦点回到这张图，键盘用户能从原处继续
            buttonRef.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}
