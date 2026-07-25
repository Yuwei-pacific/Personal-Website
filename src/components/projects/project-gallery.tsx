"use client";

// 图片画廊：瀑布流缩略图 + lightbox 大图浏览。
// 布局与 lightbox 都来自同一作者（Igor Danchenko）的配套库：
// - react-photo-album：按图片真实比例排列，不裁切、不拉伸，SSR 友好
// - yet-another-react-lightbox：缩放、拖拽、双指手势、键盘导航、焦点圈闭
import { useEffect, useMemo, useState } from "react";
import { useLenis } from "lenis/react";
import { MasonryPhotoAlbum } from "react-photo-album";
import type { Photo } from "react-photo-album";
import "react-photo-album/masonry.css";
import type { ProjectGalleryItem } from "@/lib/view-models/types";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

// 组件入参：
// - items：图片列表
// - title：标题文案
// - fullWidth：是否整屏宽度展示
// （列数由容器宽度自适应：1–5 列，见 columnsForWidth）
type ProjectGalleryProps = {
  items?: ProjectGalleryItem[];
  title?: string;
  fullWidth?: boolean;
};

// lightbox 大图的 srcSet 档位
const SLIDE_WIDTHS = [640, 1080, 1600, 2048];

// 缩略图 srcSet 档位：最窄的列约占容器 1/5，最宽时单列满宽，覆盖到 2x 屏
const THUMB_WIDTHS = [320, 480, 640, 800, 1200, 1600];

// 列数断点：沿用原 Masonry 的节奏（此处按容器宽度而非视口宽度判断）
const columnsForWidth = (containerWidth: number) => {
  if (containerWidth >= 1500) return 5;
  if (containerWidth >= 1000) return 4;
  if (containerWidth >= 600) return 3;
  if (containerWidth >= 400) return 2;
  return 1;
};

// SSR 期间没有容器尺寸，按桌面主宽度出图；水合后按实测宽度重排
const DEFAULT_CONTAINER_WIDTH = 1200;

const isSanityCdn = (url: string) => url.includes("cdn.sanity.io");

// Sanity CDN 支持 URL 参数缩放：按档位生成 srcSet，
// 过滤掉比原图还宽的档位，避免请求放大图
const buildSrcSet = (item: ProjectGalleryItem, widths: number[]) =>
  isSanityCdn(item.url)
    ? widths
        .filter((w) => w < item.width)
        .map((w) => ({
          src: `${item.url}?w=${w}&fit=max&auto=format`,
          width: w,
          height: Math.round((item.height / item.width) * w),
        }))
    : undefined;

const buildPhoto = (item: ProjectGalleryItem, index: number): Photo => ({
  key: `${index}-${item.url}`,
  src: isSanityCdn(item.url) ? `${item.url}?w=1000&fit=max&auto=format` : item.url,
  width: item.width,
  height: item.height,
  alt: item.alt,
  srcSet: buildSrcSet(item, THUMB_WIDTHS),
});

const buildSlide = (item: ProjectGalleryItem) => ({
  src: item.url,
  alt: item.alt || "",
  width: item.width,
  height: item.height,
  description: item.caption || undefined,
  srcSet: buildSrcSet(item, SLIDE_WIDTHS),
});

export function ProjectGallery({ items, title = "Gallery", fullWidth }: ProjectGalleryProps) {
  const galleryItems = useMemo(() => items ?? [], [items]);

  const photos = useMemo(() => galleryItems.map(buildPhoto), [galleryItems]);
  const slides = useMemo(() => galleryItems.map(buildSlide), [galleryItems]);

  // 当前打开的图片索引；-1 表示 lightbox 关闭
  const [activeIndex, setActiveIndex] = useState(-1);

  // lightbox 打开时暂停 Lenis：它虚拟化了滚轮事件，lightbox 自带的
  // overflow 锁滚对它无效，不停掉的话滚轮缩放图片时背景页面会跟着滚
  const lenis = useLenis();
  const lightboxOpen = activeIndex >= 0;
  useEffect(() => {
    if (!lightboxOpen || !lenis) return;
    lenis.stop();
    return () => lenis.start();
  }, [lightboxOpen, lenis]);

  if (!galleryItems.length) return null;

  return (
    <section className={`space-y-4 ${fullWidth ? "w-full" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-design-dark-text-primary mb-2">{title}</h2>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-design-dark-text-primary/50 to-transparent" />

      <MasonryPhotoAlbum
        photos={photos}
        columns={columnsForWidth}
        spacing={12}
        defaultContainerWidth={DEFAULT_CONTAINER_WIDTH}
        // 容器实际占宽：外层是 px-4 / sm:px-10 的通栏
        sizes={{
          size: "calc(100vw - 5rem)",
          sizes: [{ viewport: "(max-width: 640px)", size: "calc(100vw - 2rem)" }],
        }}
        onClick={({ index }) => setActiveIndex(index)}
        componentsProps={{
          image: {
            className:
              "rounded-card shadow-card transition-transform duration-base ease-design-out",
          },
          button: {
            className:
              "group rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary hover:[&_img]:scale-[0.97]",
          },
        }}
      />

      <Lightbox
        open={lightboxOpen}
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
