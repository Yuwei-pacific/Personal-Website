"use client";

// 图片画廊：缩略图网格 + lightbox 大图浏览。
// lightbox（缩放、拖拽、双指手势、键盘导航、焦点圈闭、滚动锁定）
// 由 yet-another-react-lightbox 提供，不再自研手势逻辑。
import Image from "next/image";
import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

// 画廊图片条目类型：包含 URL、替代文本、说明及尺寸
// （字段允许 null：与 Sanity 查询结果的可空性对齐，见 sanity/sanity.types.ts）
type GalleryItem = {
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

// 过滤后的条目：url 与尺寸已确认存在
type ResolvedGalleryItem = GalleryItem & {
  url: string;
  width: number;
  height: number;
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

// Sanity CDN 支持 URL 参数缩放：为 lightbox 生成多档宽度的 srcSet，
// 避免在弹层里加载原始大图
const SRCSET_WIDTHS = [640, 1080, 1600, 2048];

const buildSlide = (item: ResolvedGalleryItem) => {
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

export function ProjectGallery({ items, title = "Gallery", columns = "2", fullWidth }: ProjectGalleryProps) {
  // 过滤掉缺少 URL 或尺寸信息的条目，避免渲染出空图块
  const galleryItems = useMemo(
    () =>
      (items ?? []).filter(
        (item): item is ResolvedGalleryItem => Boolean(item.url && item.width && item.height)
      ),
    [items]
  );

  const slides = useMemo(() => galleryItems.map(buildSlide), [galleryItems]);

  // 当前打开的图片索引；-1 表示 lightbox 关闭
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!galleryItems.length) return null;

  // 网格列数：在不同断点下的响应式列数
  const gridColsClass = columns === "3"
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <section className={`space-y-4 ${fullWidth ? "w-full" : ""}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-design-dark-text-primary mb-2">{title}</h2>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className={`grid gap-3 ${gridColsClass}`}>
        {galleryItems.map((item, idx) => (
          <figure
            key={idx}
            className="relative overflow-hidden rounded-card bg-design-dark-surface group cursor-pointer transition-shadow duration-base hover:ring-2 hover:ring-design-dark-hover-border"
            style={{
              aspectRatio: `${item.width} / ${item.height}`,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="relative block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-hover-border"
              aria-label={`View ${item.alt || `image ${idx + 1}`}`}
            >
              <Image
                src={item.url}
                alt={item.alt || ""}
                width={item.width}
                height={item.height}
                className="w-full h-full object-contain bg-design-dark-bg transition duration-base group-hover:scale-[1.01]"
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                priority={idx < 2}
              />
            </button>
          </figure>
        ))}
      </div>

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
