// 05 应用：位图。图片放在这个项目的 Sanity 画廊里，按画廊的顺序排 ——
// 换图、调顺序、改图注都在 Sanity 里做，不用改代码。模板自带的画廊区在这一页不渲染（见 custom/index.tsx）。
// 现在是两张场景图（2026-11-27）：两张名片摆在一起，和社交主页加分享卡片。原先是五张平铺的导出图，
// 其中三张都是「黑底上一个化开的标志」，像素材清单，不像用起来的样子。两张都是排出来的样机，不是照片；
// 有了实拍，在 Sanity 里换掉就行。
// 每张按原比例完整显示，不裁切、不加效果（手册 07：作品图片是主角）。
import { SanityImage } from "@/components/ui/sanity-image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { buildScaledUrl } from "@/lib/media";
import type { ProjectGalleryItem } from "@/lib/view-models/types";

// 向 CDN 取图的宽度上限：和模板里正文栏的图同一档（2 倍屏上的 9 栏）
const MAX_WIDTH = 2400;

// 一行 6 格。每张图占几格只看它的宽高比，所以在 Sanity 里换图、调顺序不用改代码：
//   横图（不小于 1.58，网站截图、头图）整行；名片这类略扁的（1.2–1.58）半行，两张并排；方图（头像）三分之一行。
//   方图后面跟着横图时，横图只占这一行剩下的 4 格 —— 头像和分享图并排，高度正好接近。
// sm 以下一律整行。
const COLUMNS = 6;
const WIDE = 1.58;
const SQUARE = 1.2;
const SPAN_CLASS: Record<number, string> = {
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  6: "sm:col-span-6",
};
const SIZES: Record<number, string> = {
  2: "(min-width: 1024px) 24vw, (min-width: 640px) 31vw, 100vw",
  3: "(min-width: 1024px) 35vw, (min-width: 640px) 46vw, 100vw",
  4: "(min-width: 1024px) 47vw, (min-width: 640px) 62vw, 100vw",
  6: "(min-width: 1024px) 71vw, (min-width: 768px) 61vw, 100vw",
};

function layout(items: ProjectGalleryItem[]) {
  let free = COLUMNS; // 当前这一行还剩几格
  return items.map((item) => {
    const ratio = item.width / item.height;
    let span = ratio >= WIDE ? COLUMNS : ratio >= SQUARE ? 3 : 2;
    // 横图接在方图后面：填满这一行剩下的 4 格
    if (span === COLUMNS && free === 4) span = 4;
    if (span > free) free = COLUMNS;
    free -= span;
    if (free === 0) free = COLUMNS;
    return { item, span };
  });
}

export function ApplicationPlates({ items }: { items: ProjectGalleryItem[] }) {
  // 这一章只排图片；画廊里的视频条目不在这里播放
  const images = items.filter((item) => item.kind === "image");
  if (!images.length) return null;

  return (
    <div className="grid grid-cols-6 items-start gap-x-6 gap-y-10 sm:gap-y-14">
      {layout(images).map(({ item, span }) => (
        <ScrollReveal key={item.key} className={`col-span-6 ${SPAN_CLASS[span]}`}>
          <figure className="flex flex-col gap-3">
            <SanityImage
              src={buildScaledUrl(item.imageUrl, { width: MAX_WIDTH, animated: item.imageAnimated })}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes={SIZES[span]}
              className="h-auto w-full"
            />
            {item.caption ? (
              <figcaption className="font-mono text-small text-design-dark-text-muted">{item.caption}</figcaption>
            ) : null}
          </figure>
        </ScrollReveal>
      ))}
    </div>
  );
}
