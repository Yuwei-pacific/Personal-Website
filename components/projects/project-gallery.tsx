"use client";

// 图片画廊：Masonry 瀑布流缩略图 + lightbox 大图浏览。
// 瀑布流布局/入场动画由站点拥有的 Masonry 提供（GSAP）；
// lightbox（缩放、拖拽、双指手势、键盘导航、焦点圈闭、滚动锁定）
// 由 yet-another-react-lightbox 提供，不再自研手势逻辑。
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { ProjectGalleryItem } from "@/types";
import type { MasonryItem } from "@/components/projects/masonry";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

// Masonry 在渲染期读取 matchMedia / 布局尺寸，关闭 SSR
const Masonry = dynamic(() => import("@/components/projects/masonry"), {
  ssr: false,
});

// 组件入参：
// - items：图片列表
// - title：标题文案
// - fullWidth：是否整屏宽度展示
// （列数由 Masonry 按容器断点自适应：1–5 列）
type ProjectGalleryProps = {
  items?: ProjectGalleryItem[];
  title?: string;
  fullWidth?: boolean;
};

// Sanity CDN 支持 URL 参数缩放：为 lightbox 生成多档宽度的 srcSet，
// 避免在弹层里加载原始大图
const SRCSET_WIDTHS = [640, 1080, 1600, 2048];

// 瀑布流缩略图用中等宽度即可（列宽最多 ~1/2 视口）
const thumbUrl = (url: string) =>
  url.includes("cdn.sanity.io") ? `${url}?w=1000&fit=max&auto=format` : url;

const buildSlide = (item: ProjectGalleryItem) => {
  const isSanityCdn = item.url.includes("cdn.sanity.io");
  return {
    src: item.url,
    alt: item.alt || "",
    width: item.width,
    height: item.height,
    description: item.caption || undefined,
    srcSet: isSanityCdn
      ? SRCSET_WIDTHS.filter((w) => w < item.width).map((w) => ({
          src: `${item.url}?w=${w}&fit=max&auto=format`,
          width: w,
          height: Math.round((item.height / item.width) * w),
        }))
      : undefined,
  };
};

export function ProjectGallery({ items, title = "Gallery", fullWidth }: ProjectGalleryProps) {
  const galleryItems = useMemo(() => items ?? [], [items]);

  const slides = useMemo(() => galleryItems.map(buildSlide), [galleryItems]);

  // Masonry 条目：id 即在 galleryItems 中的索引，点击时用它打开对应 lightbox 页
  const masonryItems = useMemo<MasonryItem[]>(
    () =>
      galleryItems.map((item, idx) => ({
        id: String(idx),
        img: thumbUrl(item.url),
        width: item.width,
        height: item.height,
        alt: item.alt,
      })),
    [galleryItems]
  );

  // 当前打开的图片索引；-1 表示 lightbox 关闭
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!galleryItems.length) return null;

  return (
    <section className={`space-y-4 ${fullWidth ? "w-full" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-design-dark-text-primary mb-2">{title}</h2>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-design-dark-text-primary/50 to-transparent" />
      <Masonry
        items={masonryItems}
        preloadCount={8}
        animateFrom="bottom"
        scaleOnHover
        hoverScale={0.97}
        blurToFocus
        onItemClick={(_item, index) => setActiveIndex(index)}
      />

      <Lightbox
        open={activeIndex >= 0}
        index={activeIndex}
        close={() => setActiveIndex(-1)}
        slides={slides}
        plugins={[Zoom, Captions, Counter]}
        zoom={{ maxZoomPixelRatio: 3 }}
        counter={{ container: { style: { top: 0 } } }}
        // 背景色对齐站点深色分区 token
        styles={{ container: { backgroundColor: "hsl(var(--color-bg-dark) / 0.95)" } }}
        controller={{ closeOnBackdropClick: true }}
      />
    </section>
  );
}
