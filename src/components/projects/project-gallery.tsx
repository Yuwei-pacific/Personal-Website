"use client";

// 多媒体画廊：图片 / GIF / 视频混排的 justified 行布局 + lightbox 大图浏览。
// 布局与 lightbox 都来自同一作者（Igor Danchenko）的配套库：
// - react-photo-album：按真实比例排列，不裁切、不拉伸，SSR 友好
// - yet-another-react-lightbox：缩放、拖拽、键盘导航、焦点圈闭，Video 插件播视频
//
// 视频条目在网格里只显示 poster 缩略图（加播放角标），点开才在 lightbox 里播放——
// 网格里同时自动播放多个视频对低端机器是灾难。
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuPlay } from "react-icons/lu";
import { RowsPhotoAlbum } from "react-photo-album";
import type { Photo } from "react-photo-album";
import "react-photo-album/rows.css";
import { InkRule } from "@/components/ui/ink-rule";
import type { ProjectGalleryItem } from "@/lib/view-models/types";
import { buildScaledUrl, buildSrcSet } from "@/lib/media";
import { ScrollTrigger } from "@/lib/animation/scroll-trigger";

// 灯箱与视频/缩放插件在首次点击时再加载（与 zoomable-image.tsx 一致）
const GalleryLightbox = dynamic(() => import("./gallery-lightbox"), { ssr: false });

// 组件入参：
// - items：媒体列表（图片 / GIF / 视频）
// - title：标题文案
type ProjectGalleryProps = {
  items?: ProjectGalleryItem[];
  title: string;
  playVideoLabel: string;
  viewImageLabel: string;
};

// 缩略图 srcSet 档位：覆盖单列满宽到多列窄栏，含 2x 屏
const THUMB_WIDTHS = [320, 480, 640, 800, 1200, 1600];

// justified 行布局的目标行高：算法会在这个高度附近凑整每一行，
// 保证每行等高、图片不变形。窄容器给小行高，避免一行只塞得下半张图
const targetRowHeightForWidth = (containerWidth: number) => {
  if (containerWidth >= 1500) return 320;
  if (containerWidth >= 1000) return 280;
  if (containerWidth >= 600) return 240;
  return 200;
};

// SSR 期间没有容器尺寸，按桌面主宽度出图；水合后按实测宽度重排
const DEFAULT_CONTAINER_WIDTH = 1200;

// 网格缩略图：视频用它的 poster，图片用自身
type GalleryPhoto = Photo & { isVideo: boolean };

const buildPhoto = (
  item: ProjectGalleryItem,
  index: number,
  labels: { playVideo: string; viewImage: string },
): GalleryPhoto => {
  const isVideo = item.kind === "video";
  const { imageUrl, imageAnimated, width, height } = item;

  return {
    key: item.key,
    src: buildScaledUrl(imageUrl, { width: 1000, animated: imageAnimated }),
    width,
    height,
    // alt 为空 = 装饰性，屏幕阅读器跳过图片；
    // label 始终有值，保证可点击按钮对键盘/读屏用户仍有可读名称
    alt: item.alt,
    label:
      item.alt ||
      `${isVideo ? labels.playVideo : labels.viewImage} ${index + 1}`,
    isVideo,
    srcSet: buildSrcSet({ url: imageUrl, width, height, animated: imageAnimated }, THUMB_WIDTHS),
  };
};

export function ProjectGallery({
  items,
  title,
  playVideoLabel,
  viewImageLabel,
}: ProjectGalleryProps) {
  const galleryItems = useMemo(() => items ?? [], [items]);
  const galleryRef = useRef<HTMLElement>(null);

  const photos = useMemo(
    () =>
      galleryItems.map((item, index) =>
        buildPhoto(item, index, {
          playVideo: playVideoLabel,
          viewImage: viewImageLabel,
        }),
      ),
    [galleryItems, playVideoLabel, viewImageLabel],
  );

  // 当前打开的媒体索引；-1 表示 lightbox 关闭
  const [activeIndex, setActiveIndex] = useState(-1);

  // RowsPhotoAlbum 会在客户端拿到真实容器宽度后重新排版。跨路由进入项目页时，
  // Footer 的 ScrollTrigger 可能早于这次高度变化完成初始化，继续使用旧的起止位置。
  // 监听画廊自身尺寸并在下一帧统一 refresh，避免 Footer 内容停在上移状态。
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    let frame = 0;
    const scheduleRefresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        ScrollTrigger.refresh();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleRefresh);
    resizeObserver.observe(gallery);
    scheduleRefresh();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [galleryItems.length]);

  if (!galleryItems.length) return null;

  return (
    <section ref={galleryRef} className="w-full">
      {/* 与正文章节同一套抬头：细线 + 左对齐标题，数量沿用首页 Work 标题旁的计数写法 */}
      <InkRule variant={3} className="mb-8 text-design-dark-text-primary sm:mb-10" />
      <div className="mb-8 flex items-end gap-1">
        <h2 className="font-display text-3xl leading-[1.1] text-design-dark-text-primary lg:text-section">
          {title}
        </h2>
        <span aria-hidden="true" className="font-mono text-small text-design-dark-text-muted">
          ({galleryItems.length})
        </span>
      </div>

      <RowsPhotoAlbum
        photos={photos}
        targetRowHeight={targetRowHeightForWidth}
        // 媒体总数不足以铺满一行时，限制高度，避免单条被撑到超大
        rowConstraints={{ singleRowMaxHeight: 420 }}
        spacing={12}
        defaultContainerWidth={DEFAULT_CONTAINER_WIDTH}
        // 容器实际占宽：通栏减去两侧页边距（px-edge / sm:px-edge-sm）
        sizes={{
          size: "calc(100vw - 4rem)",
          sizes: [{ viewport: "(max-width: 640px)", size: "calc(100vw - 3rem)" }],
        }}
        onClick={({ index }) => setActiveIndex(index)}
        render={{
          // 视频条目盖一个播放角标，和项目卡片的箭头角标同款语言
          extras: (_props, { photo }) =>
            photo.isVideo ? (
              <span className="pointer-events-none absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center border border-design-dark-text-primary/40 bg-design-dark-bg/50 text-design-dark-text-primary backdrop-blur-md">
                <LuPlay className="h-4 w-4" />
              </span>
            ) : null,
        }}
        componentsProps={{
          image: {
            className:
              "shadow-card transition-transform duration-base ease-design-out",
          },
          button: {
            className:
              "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary hover:[&_img]:scale-[0.97]",
          },
        }}
      />

      {activeIndex >= 0 ? (
        <GalleryLightbox
          items={galleryItems}
          index={activeIndex}
          onClose={() => setActiveIndex(-1)}
        />
      ) : null}
    </section>
  );
}
