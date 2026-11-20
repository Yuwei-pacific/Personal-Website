// 内容模块里的媒体：单个媒体位（SectionMedia）和并排的一组（SectionMediaGroup）。
// 媒体的尺寸规则全在这个文件里 —— 占多宽、向 CDN 取多大的图、偏高的怎么放。
//
// 有视频就播视频（图片作 poster），否则渲染图片。
// 视频行为与详情页封面一致——静音自动循环、进入视口才播、离开即暂停，
// 并尊重「减弱动画」偏好。图片由浏览器按 srcset 直连 Sanity CDN（见 sanityImageLoader），
// 动图（GIF）不加 auto=format 以保住动画。
// 图片可以点开放大（zoomable-image.tsx）；视频不放大。
import { SanityImage } from "@/components/ui/sanity-image";

import type { ProjectSectionMedia } from "@/lib/view-models/types";
import { buildScaledUrl } from "@/lib/media";

import { CoverVideo } from "./cover-video";
import { ZoomableImage } from "./zoomable-image";

// ── 位置 ──────────────────────────────────────────────────────────────
// 媒体只有两种宽度：正文栏和通栏（版心）。
// sizes 告诉浏览器这个位置实际占多宽，用来挑 srcset 档位：正文栏在 lg 是 12 栏里的 9 栏（约 71vw），
// md 是 8 栏（约 61vw），再窄是单列满宽 —— 跟着 project-sections.tsx 的 SECTION_TEXT_COL 走，那边改栏数这里要跟着改。
// maxWidth 是向 CDN 取图的宽度上限，按这个位置在 2 倍屏上的像素给；给小了，图里的小字在高分屏上是糊的。
// scripts/content-audit.mjs 按同一组宽度检查上传的图够不够大。
const SLOTS = {
  column: { vw: 71, sizes: "(min-width: 1024px) 71vw, (min-width: 768px) 61vw, 100vw", maxWidth: 2400 },
  full: { vw: 100, sizes: "100vw", maxWidth: 2880 },
} as const;

export type MediaSlot = keyof typeof SLOTS;

// 并排的一组里每个媒体的取图上限，也是视频 poster 的档位
const ITEM_MAX_WIDTH = 1600;

// ── 偏高的媒体 ────────────────────────────────────────────────────────
// 竖图、方图、手机录屏按栏宽排会比一屏还高（一段 9:19.5 的录屏在正文栏里有两屏多）。
// 规则只有一条：每个媒体位都撑满自己的栏宽，右缘对齐。偏高的媒体不单独缩小靠左，
// 而是坐在一块撑满栏宽的底板上居中、限高 —— 页面上看到的始终是一块横向的矩形，
// 和其他项目里「设备放在底板上」的成图一个样子。
// 只管宽高比小于 1.3 的：横图撑满版心时接近一屏高是有意的，和封面一样。
// （content-audit.mjs 里有同一个 1.3，改这里时一起改。）
const TALL_ASPECT = 1.3;
// 底板上的媒体高度。加上底板的留白和图注，整块不超过约 80% 视口高
const PLATE_MEDIA_HEIGHT = "64svh";
// 底板：比所在的纸面深一档（和媒体占位色同一个 token），留白随屏宽。
// 想换底板的颜色或留白，只改这一行，所有项目一起变
const PLATE = "bg-design-dark-surface px-4 py-6 sm:p-10";

type Dimensions = { width: number; height: number };

const isTall = (media: Dimensions) => media.width / media.height < TALL_ASPECT;

/** 这一组里有偏高的媒体：整组坐在同一块底板上，留在正文栏（见 SectionMediaGroup） */
export const hasTallMedia = (items: readonly Dimensions[]) => items.some(isTall);

/** 底板上的媒体宽度上限：使它的高度不超过 PLATE_MEDIA_HEIGHT */
const plateMaxWidth = (media: Dimensions) =>
  isTall(media)
    ? { maxWidth: `calc(${(media.width / media.height).toFixed(4)} * ${PLATE_MEDIA_HEIGHT})` }
    : undefined;

// ── 组件 ──────────────────────────────────────────────────────────────
export type MediaLabels = { playLabel: string; pauseLabel: string; zoomLabel: string };

type FrameProps = {
  media: ProjectSectionMedia;
  sizes: string;
  maxWidth: number;
  priority?: boolean;
  labels: MediaLabels;
};

// 媒体本体：按原始比例占位的一个矩形，里面是视频或可点开的图片
function MediaFrame({ media, sizes, maxWidth, priority, labels }: FrameProps) {
  return (
    <div
      className="relative w-full overflow-hidden bg-design-dark-surface"
      style={{ aspectRatio: `${media.width} / ${media.height}` }}
    >
      {media.video ? (
        <CoverVideo
          src={media.video.url}
          poster={buildScaledUrl(media.imageUrl, { width: ITEM_MAX_WIDTH, animated: false })}
          className="h-full w-full object-cover"
          playLabel={labels.playLabel}
          pauseLabel={labels.pauseLabel}
        />
      ) : (
        <ZoomableImage
          label={labels.zoomLabel}
          source={{
            url: media.imageUrl,
            alt: media.alt,
            caption: media.caption,
            width: media.width,
            height: media.height,
            animated: media.imageAnimated,
          }}
        >
          <SanityImage
            // media.imageUrl 是裸的 CDN 原图地址（见 view-models/project.ts）。
            // maxWidth 是 loader 的宽度上限；fit=max 不会放大，小图不受影响。
            src={buildScaledUrl(media.imageUrl, { width: maxWidth, animated: media.imageAnimated })}
            alt={media.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        </ZoomableImage>
      )}
    </div>
  );
}

function MediaCaption({ media }: { media: ProjectSectionMedia }) {
  return media.caption ? (
    <figcaption className="mt-3 text-small leading-5 text-design-dark-text-muted">{media.caption}</figcaption>
  ) : null;
}

type SectionMediaProps = {
  media: ProjectSectionMedia;
  /** 这个媒体排在哪种宽度里 */
  slot: MediaSlot;
  priority?: boolean;
  labels: MediaLabels;
};

/** 单个媒体位：撑满所在的宽度；偏高的坐在底板上居中、限高 */
export function SectionMedia({ media, slot, priority, labels }: SectionMediaProps) {
  const { sizes, maxWidth } = SLOTS[slot];
  const frame = <MediaFrame media={media} sizes={sizes} maxWidth={maxWidth} priority={priority} labels={labels} />;

  return (
    <figure className="w-full">
      {isTall(media) ? (
        <div className={`flex justify-center ${PLATE}`}>
          <div className="w-full" style={plateMaxWidth(media)}>
            {frame}
          </div>
        </div>
      ) : (
        frame
      )}
      <MediaCaption media={media} />
    </figure>
  );
}

type SectionMediaGroupProps = {
  /** 2–3 个（Sanity 里限制的） */
  items: ProjectSectionMedia[];
  caption: string | null;
  labels: MediaLabels;
};

/**
 * 并排的一组媒体。
 * - 都是横图：通栏并排撑满。
 * - 有偏高的：整组坐在一块底板上，每个限高、在自己的格子里居中。
 *   手机上一排放不下（三个并排每个只有一百来像素宽），改成横向滑动：
 *   每个占七成宽，露出下一个的边，高度仍在一屏以内。
 *
 * 这一组排在正文栏还是通栏，由 project-sections.tsx 按 hasTallMedia 决定。
 */
export function SectionMediaGroup({ items, caption, labels }: SectionMediaGroupProps) {
  const count = items.length;
  const columns = count === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  const tall = hasTallMedia(items);
  const perItem = (slot: MediaSlot) => Math.ceil(SLOTS[slot].vw / count);

  return (
    <div>
      {tall ? (
        <div className={PLATE}>
          {/* 滑动条用 -mx-4 px-4 抵掉底板在手机上的左右留白（PLATE 里的 px-4），滑到底板边缘才被裁掉；
              pb-4 给滚动条留一条，不压图注 */}
          <div
            className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:gap-6 sm:overflow-visible sm:p-0 ${columns}`}
          >
            {items.map((item) => (
              <div key={item.key} className="w-[70%] shrink-0 snap-center sm:w-auto">
                <figure className="mx-auto w-full" style={plateMaxWidth(item)}>
                  <MediaFrame
                    media={item}
                    sizes={`(min-width: 640px) ${perItem("column")}vw, 70vw`}
                    maxWidth={ITEM_MAX_WIDTH}
                    labels={labels}
                  />
                  <MediaCaption media={item} />
                </figure>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 ${columns}`}>
          {items.map((item) => (
            <figure key={item.key} className="w-full">
              <MediaFrame
                media={item}
                sizes={`(min-width: 640px) ${perItem("full")}vw, 100vw`}
                maxWidth={ITEM_MAX_WIDTH}
                labels={labels}
              />
              <MediaCaption media={item} />
            </figure>
          ))}
        </div>
      )}
      {caption ? <p className="mt-3 text-small leading-5 text-design-dark-text-muted">{caption}</p> : null}
    </div>
  );
}
