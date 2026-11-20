"use client";

// 正文图片的放大视图：单张图的 lightbox，可缩放、拖拽。
// 这个文件由 zoomable-image.tsx 在第一次点击时才动态加载 ——
// 不点图的访客不会下载 lightbox 的脚本和样式。画廊用的是同一个库（project-gallery.tsx）。
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { useLightboxLock } from "@/hooks/use-lightbox-lock";
import { buildSrcSet } from "@/lib/media";

export type ZoomSource = {
  url: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
  animated: boolean;
};

// 放大后的档位比页面里的大一级：点开就是为了看清图表和界面里的小字
const ZOOM_WIDTHS = [1080, 1600, 2048, 2880];

export default function ImageLightbox({ source, onClose }: { source: ZoomSource; onClose: () => void }) {
  useLightboxLock(true);

  return (
    <Lightbox
      open
      close={onClose}
      slides={[
        {
          src: source.url,
          alt: source.alt,
          width: source.width,
          height: source.height,
          description: source.caption || undefined,
          srcSet: buildSrcSet(source, ZOOM_WIDTHS),
        },
      ]}
      plugins={[Zoom, Captions]}
      zoom={{ maxZoomPixelRatio: 3 }}
      // 只有一张图：不要左右箭头，也不循环
      carousel={{ finite: true }}
      render={{ buttonPrev: () => null, buttonNext: () => null }}
      // 背景色用不随主题变化的墨色：lightbox 的控件是白色，浅色模式下也必须是深底
      styles={{ container: { backgroundColor: "hsl(var(--color-ink) / 0.95)" } }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}
