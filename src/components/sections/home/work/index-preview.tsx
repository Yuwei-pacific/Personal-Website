"use client";

// 目录的悬停预览：一小滩墨，封面（或封面视频）在墨里显出来。
// 悬停的那一行就是此刻「正在看」的地方，所以预览完整化开、是彩色的；换一行，墨重新落下、漫开（约 0.9 秒）。
// 移开后保留最后一个项目淡出，而不是瞬间消失。
// 不支持 WebGL 时退回普通图片；减弱动画时不显影、不播视频（渲染器只画静止的一帧）。
import { useEffect, useState } from "react";

import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { coverVideo, loadCoverImage, playOnly } from "./cover-media";
import { POOL_PAD, U, WORK_INK, drawCover, poolPath } from "./ink-geometry";

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };

export const PREVIEW_WIDTH = 340;
export const PREVIEW_HEIGHT = 240;
// 墨滩边缘离预览框留多少（POOL_PAD 是往外扩的量，这里反过来先收进去）
const INSET = POOL_PAD + 18;
// 晕画在框外面：画布四周多出这么多
const BLEED = 56;

export type PreviewItem = { id: string; image: string | null; video: string | null };

function buildPreview(item: PreviewItem, image: HTMLImageElement | null) {
  return (width: number, height: number): InkSpec => {
    const pool = poolPath({ x: INSET, y: INSET, width: width - INSET * 2, height: height - INSET * 2 }, item.id.length);
    return {
      padding: { top: BLEED, right: BLEED, bottom: BLEED, left: BLEED },
      draw: (ctx) => ctx.fill(pool),
      drawImage: (ctx) => {
        if (!image) return;
        ctx.save();
        ctx.clip(pool);
        drawCover(ctx, image, { width: image.naturalWidth, height: image.naturalHeight }, { x: 0, y: 0, width, height });
        ctx.restore();
      },
      params: {
        ...WORK_INK,
        loose: 8 * U,
        reveal: { x: width / 2, y: height / 2, radius: Math.max(width, height) * 0.85 },
        revealDuration: 0.9,
        revealPause: 0,
        replayReveal: true,
        // 预览小，细节经不起半分辨率
        blurScale: 1,
      },
    };
  };
}

export function IndexPreview({ item, top }: { item: PreviewItem | null; top: number }) {
  const supported = useInkSupported();
  const reducedMotion = usePrefersReducedMotion();
  // 移开后保留最后一个项目，让它淡出
  const [shown, setShown] = useState<PreviewItem | null>(item);
  if (item && item !== shown) setShown(item);
  const [images, setImages] = useState<Record<string, HTMLImageElement | null>>({});

  // 封面按需加载（第一次悬停时），加载失败记为 null：墨滩显示为纯墨
  const url = shown?.image ?? null;
  const id = shown?.id ?? null;
  useEffect(() => {
    if (!url || !id) return;
    let cancelled = false;
    loadCoverImage(url).then((image) => {
      if (!cancelled) setImages((prev) => (id in prev ? prev : { ...prev, [id]: image }));
    });
    return () => {
      cancelled = true;
    };
  }, [url, id]);

  const video = item?.video && supported && !reducedMotion ? coverVideo(item.id, item.video) : null;
  useEffect(() => {
    if (item) playOnly(video);
  }, [item, video]);

  const image = shown ? (images[shown.id] ?? null) : null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[12%] z-10 hidden transition-[top,opacity] duration-slow ease-design-out motion-reduce:transition-none md:block"
      style={{ top: top - PREVIEW_HEIGHT / 2, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, opacity: item ? 1 : 0 }}
    >
      {shown && supported ? (
        <InkSurface
          className="size-full"
          tables={TABLES}
          build={buildPreview(shown, image)}
          buildKey={`preview:${shown.id}:${image ? "image" : "pending"}`}
          video={{ element: video, rect: { x: 0, y: 0, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT } }}
          fallback={null}
        />
      ) : null}
      {shown && !supported && shown.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown.image} alt="" className="size-full object-cover" />
      ) : null}
    </div>
  );
}
