// 内容模块里的单个媒体位：有视频就播视频（图片作 poster），否则渲染图片。
// 视频行为与详情页封面一致——静音自动循环、进入视口才播、离开即暂停，
// 并尊重「减弱动画」偏好。图片走 Next 优化，动图（GIF）跳过优化保住动画。
import Image from "next/image";

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
};

export function SectionMedia({ media, sizes, className, priority }: SectionMediaProps) {
  const frame = cn(
    "relative w-full overflow-hidden rounded-media bg-design-dark-surface",
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
          />
        ) : (
          <Image
            src={media.imageUrl}
            alt={media.alt}
            fill
            sizes={sizes}
            priority={priority}
            // 动图必须跳过 Next 的图片优化，否则动画会被压成静帧
            unoptimized={media.imageAnimated}
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
