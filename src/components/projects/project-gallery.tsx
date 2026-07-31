"use client";

// 多媒体画廊：图片 / GIF / 视频混排的 justified 行布局 + lightbox 大图浏览。
// 布局与 lightbox 都来自同一作者（Igor Danchenko）的配套库：
// - react-photo-album：按真实比例排列，不裁切、不拉伸，SSR 友好
// - yet-another-react-lightbox：缩放、拖拽、键盘导航、焦点圈闭，Video 插件播视频
//
// 视频条目在网格里只显示 poster 缩略图（加播放角标），点开才在 lightbox 里播放——
// 网格里同时自动播放多个视频对低端机器是灾难。
import { useEffect, useMemo, useState } from "react";
import { useLenis } from "lenis/react";
import { LuPlay } from "react-icons/lu";
import { RowsPhotoAlbum } from "react-photo-album";
import type { Photo } from "react-photo-album";
import "react-photo-album/rows.css";
import type { ProjectGalleryItem } from "@/lib/view-models/types";
import { buildScaledUrl, buildSrcSet } from "@/lib/media";
import Lightbox from "yet-another-react-lightbox";
import type { SlideImage, SlideVideo } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

// 组件入参：
// - items：媒体列表（图片 / GIF / 视频）
// - title：标题文案
// - fullWidth：是否整屏宽度展示
type ProjectGalleryProps = {
  items?: ProjectGalleryItem[];
  title: string;
  playVideoLabel: string;
  viewImageLabel: string;
  fullWidth?: boolean;
};

// lightbox 大图的 srcSet 档位
const SLIDE_WIDTHS = [640, 1080, 1600, 2048];

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

const buildSlide = (item: ProjectGalleryItem): SlideImage | SlideVideo => {
  const description = item.caption || undefined;
  const { imageUrl, imageAnimated, width, height } = item;

  if (item.kind === "video") {
    return {
      type: "video",
      // 同一张图在这里当封面帧；poster 是静帧用途，不需要保留 GIF 动画
      poster: buildScaledUrl(imageUrl, { width: 1600, animated: false }),
      width,
      height,
      description,
      sources: [{ src: item.videoUrl, type: item.mimeType }],
    };
  }

  return {
    src: imageUrl,
    alt: item.alt,
    width,
    height,
    description,
    srcSet: buildSrcSet({ url: imageUrl, width, height, animated: imageAnimated }, SLIDE_WIDTHS),
  };
};

export function ProjectGallery({
  items,
  title,
  playVideoLabel,
  viewImageLabel,
  fullWidth,
}: ProjectGalleryProps) {
  const galleryItems = useMemo(() => items ?? [], [items]);

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
  const slides = useMemo(() => galleryItems.map(buildSlide), [galleryItems]);

  // 当前打开的媒体索引；-1 表示 lightbox 关闭
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

      <RowsPhotoAlbum
        photos={photos}
        targetRowHeight={targetRowHeightForWidth}
        // 媒体总数不足以铺满一行时，限制高度，避免单条被撑到超大
        rowConstraints={{ singleRowMaxHeight: 420 }}
        spacing={12}
        defaultContainerWidth={DEFAULT_CONTAINER_WIDTH}
        // 容器实际占宽：外层是 px-4 / sm:px-10 的通栏
        sizes={{
          size: "calc(100vw - 5rem)",
          sizes: [{ viewport: "(max-width: 640px)", size: "calc(100vw - 2rem)" }],
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

      <Lightbox
        open={lightboxOpen}
        index={activeIndex}
        close={() => setActiveIndex(-1)}
        slides={slides}
        plugins={[Zoom, Captions, Counter, Video]}
        zoom={{ maxZoomPixelRatio: 3 }}
        counter={{ container: { style: { top: 0 } } }}
        // 静音自动循环：符合作品集里 UI 演示片段的用法，
        // 保留 controls 让访客能自己解除静音或暂停
        video={{ autoPlay: true, muted: true, loop: true, controls: true, playsInline: true }}
        // 背景色对齐站点深色分区 token
        styles={{ container: { backgroundColor: "hsl(var(--color-bg-dark) / 0.95)" } }}
        controller={{ closeOnBackdropClick: true }}
      />
    </section>
  );
}
