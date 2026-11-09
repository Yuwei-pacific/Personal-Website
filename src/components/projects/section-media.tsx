// 内容模块里的单个媒体位：有视频就播视频（图片作 poster），否则渲染图片。
// 视频行为与详情页封面一致——静音自动循环、进入视口才播、离开即暂停，
// 并尊重「减弱动画」偏好。图片由浏览器按 srcset 直连 Sanity CDN（见 sanityImageLoader），
// 动图（GIF）不加 auto=format 以保住动画。
import { SanityImage } from "@/components/ui/sanity-image";

import type { ProjectSectionMedia } from "@/lib/view-models/types";
import { buildScaledUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

import { CoverVideo } from "./cover-video";

type SectionMediaProps = {
  media: ProjectSectionMedia;
  /** 告知浏览器该媒体的实际占宽，避免下载过大的图 */
  sizes: string;
  className?: string;
  priority?: boolean;
  playLabel: string;
  pauseLabel: string;
};

export function SectionMedia({
  media,
  sizes,
  className,
  priority,
  playLabel,
  pauseLabel,
}: SectionMediaProps) {
  const frame = cn(
    "relative w-full overflow-hidden bg-design-dark-surface",
    className
  );

  return (
    <figure className="w-full">
      <div className={frame} style={{ aspectRatio: `${media.width} / ${media.height}` }}>
        {media.video ? (
          <CoverVideo
            src={media.video.url}
            poster={buildScaledUrl(media.imageUrl, { width: 1600, animated: false })}
            className="h-full w-full object-cover"
            playLabel={playLabel}
            pauseLabel={pauseLabel}
          />
        ) : (
          <SanityImage
            // media.imageUrl 是裸的 CDN 原图地址（见 view-models/project.ts）。
            // 这里的 1600 是 loader 的宽度上限，与上面的视频 poster 同档；
            // fit=max 不会放大，小图不受影响。
            src={buildScaledUrl(media.imageUrl, {
              width: 1600,
              animated: media.imageAnimated,
            })}
            alt={media.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        )}
      </div>
      {media.caption && (
        <figcaption className="mt-3 text-small leading-5 text-design-dark-text-muted">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}
