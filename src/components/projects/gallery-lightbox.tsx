"use client";

// 画廊的大图 / 视频灯箱：由 project-gallery.tsx 在首次点击时才动态加载，
// 避免未打开画廊的访客在首屏下载 lightbox 脚本、四个插件和样式表。
import { useMemo } from "react";
import Lightbox from "yet-another-react-lightbox";
import type { SlideImage, SlideVideo } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

import { useLightboxLock } from "@/hooks/use-lightbox-lock";
import { buildScaledUrl, buildSrcSet } from "@/lib/media";
import type { ProjectGalleryItem } from "@/lib/view-models/types";

// lightbox 大图的 srcSet 档位
const SLIDE_WIDTHS = [640, 1080, 1600, 2048];

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

export default function GalleryLightbox({
  items,
  index,
  onClose,
}: {
  items: ProjectGalleryItem[];
  index: number;
  onClose: () => void;
}) {
  useLightboxLock(true);
  const slides = useMemo(() => items.map(buildSlide), [items]);

  return (
    <Lightbox
      open
      index={index}
      close={onClose}
      slides={slides}
      plugins={[Zoom, Captions, Counter, Video]}
      zoom={{ maxZoomPixelRatio: 3 }}
      counter={{ container: { style: { top: 0 } } }}
      // 静音自动循环：符合作品集里 UI 演示片段的用法，
      // 保留 controls 让访客能自己解除静音或暂停
      video={{ autoPlay: true, muted: true, loop: true, controls: true, playsInline: true }}
      // 背景色用不随主题变化的墨色：lightbox 的控件是白色，浅色模式下也必须是深底
      styles={{ container: { backgroundColor: "hsl(var(--color-ink) / 0.95)" } }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}
