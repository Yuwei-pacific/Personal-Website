// 05 应用：位图（网站的截图、名片、头像和头图）。图片放在这个项目的 Sanity 画廊里，按画廊的顺序排 ——
// 换图、调顺序、改图注都在 Sanity 里做，不用改代码。模板自带的画廊区在这一页不渲染（见 custom/index.tsx）。
// 每张按原比例完整显示，不裁切、不加效果（手册 07：作品图片是主角）。
import { SanityImage } from "@/components/ui/sanity-image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { buildScaledUrl } from "@/lib/media";
import type { ProjectGalleryItem } from "@/lib/view-models/types";

// 向 CDN 取图的宽度上限：和模板里正文栏的图同一档（2 倍屏上的 9 栏）
const MAX_WIDTH = 2400;
// 横图（宽高比不小于这个数）独占一行；更方、更竖的两张一行
const WIDE = 1.4;

export function ApplicationPlates({ items }: { items: ProjectGalleryItem[] }) {
  // 这一章只排图片；画廊里的视频条目不在这里播放
  const images = items.filter((item) => item.kind === "image");
  if (!images.length) return null;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-y-14">
      {images.map((item) => {
        const wide = item.width / item.height >= WIDE;
        return (
          <ScrollReveal key={item.key} className={wide ? "col-span-2" : "col-span-2 sm:col-span-1"}>
            <figure className="flex flex-col gap-3">
              <SanityImage
                src={buildScaledUrl(item.imageUrl, { width: MAX_WIDTH, animated: item.imageAnimated })}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes={wide ? "(min-width: 1024px) 71vw, (min-width: 768px) 61vw, 100vw" : "(min-width: 1024px) 35vw, (min-width: 640px) 46vw, 100vw"}
                className="h-auto w-full"
              />
              {item.caption ? (
                <figcaption className="font-mono text-small text-design-dark-text-muted">{item.caption}</figcaption>
              ) : null}
            </figure>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
