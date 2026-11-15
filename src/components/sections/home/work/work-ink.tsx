"use client";

// Work 区的化开画布：一块铺满区块的 InkSurface，按区块里的占位画墨滩（封面显在墨里）与墨线，
// 并负责「一次只化开一处」：滚动时选出离视口中线最近的精选作为焦点 ——
// 焦点处完整化开、封面彩色、有视频就在墨里播放；其余收成墨边、封面黑白静止。
//
// 焦点同时写到占位的 data-focused 上：不支持 WebGL 时，占位里的普通封面靠它决定黑白 / 彩色。
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { coverVideo, playOnly } from "./cover-media";
import {
  WORK_INK,
  drawCover,
  poolBounds,
  poolPath,
  strokeBand,
  strokeCore,
  threadSamples,
  type Rect,
} from "./ink-geometry";

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };
// 焦点：离视口中线多远以内才算（视口高度的比例）；都不在范围内时全部收拢
const FOCUS_RANGE = 0.55;

type FeaturedMedia = { id: string; video: string | null };
type VideoState = { element: HTMLVideoElement | null; rect?: Rect };

// 单列（md 以下）时墨线走法不同
const desktopQuery = "(min-width: 768px)";
const subscribeDesktop = (onChange: () => void) => {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isDesktop = () => window.matchMedia(desktopQuery).matches;

const coversIn = (section: Element) => [...section.querySelectorAll<HTMLElement>('[data-ink="cover"]')];

function relative(element: Element, box: DOMRect): Rect {
  const r = element.getBoundingClientRect();
  return { x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height };
}

function buildWork(mobile: boolean) {
  return (width: number, height: number, box: HTMLElement): InkSpec => {
    const boxRect = box.getBoundingClientRect();
    const section = box.parentElement;
    const covers = section ? coversIn(section) : [];
    const rects = covers.map((el) => relative(el, boxRect));
    const rule = section?.querySelector('[data-ink="rule"]');
    const ruleY = rule ? relative(rule, boxRect).y : height - 40;
    const thread = threadSamples(width, rects, ruleY, mobile);
    const pools = rects.map((rect, i) => poolPath(rect, i + 3));

    return {
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      // 区块有好几屏高：画布只画视口那么高的一段（整块画布每帧合成会把帧率拖到一半）
      windowed: true,
      draw: (ctx) => {
        strokeBand(ctx, thread);
        ctx.fillStyle = "#000";
        pools.forEach((pool) => ctx.fill(pool));
      },
      drawCore: (ctx) => strokeCore(ctx, thread),
      // 封面：占位里那张（带 CORS 的）<img> 加载好了才画；没加载到的墨滩就是纯墨
      drawImage: (ctx) => {
        covers.forEach((cover, i) => {
          const image = cover.querySelector("img");
          if (!image?.complete || !image.naturalWidth) return;
          ctx.save();
          ctx.clip(pools[i]);
          drawCover(ctx, image, { width: image.naturalWidth, height: image.naturalHeight }, poolBounds(rects[i]));
          ctx.restore();
        });
      },
      params: {
        ...WORK_INK,
        reveal: null,
        // 纹理覆盖整个区块：像素密度收一点，省显存
        maxDpr: 1.5,
        focusRegions: rects,
      },
    };
  };
}

export function WorkInk({ featured }: { featured: FeaturedMedia[] }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const supported = useInkSupported();
  const reducedMotion = usePrefersReducedMotion();
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => true);
  const [loaded, setLoaded] = useState(0);
  const [focus, setFocus] = useState(-1);
  const [video, setVideo] = useState<VideoState>({ element: null });

  // 不支持 WebGL：给区块打标记，占位里的普通封面改为可见
  useEffect(() => {
    const section = anchorRef.current?.parentElement;
    if (!section) return;
    if (supported) delete section.dataset.ink;
    else section.dataset.ink = "off";
  }, [supported]);

  // 封面图片加载完一张，就重画一次（重算化开）。已经加载好的直接算进去
  useEffect(() => {
    const section = anchorRef.current?.parentElement;
    if (!section) return;
    const images = [...section.querySelectorAll<HTMLImageElement>('[data-ink="cover"] img')];
    const onLoad = () => setLoaded((n) => n + 1);
    images.forEach((image) => {
      if (image.complete) onLoad();
      else image.addEventListener("load", onLoad, { once: true });
    });
    return () => images.forEach((image) => image.removeEventListener("load", onLoad));
  }, []);

  // 焦点：滚动 / 缩放时（每帧最多一次）选出离视口中线最近的精选
  useEffect(() => {
    const section = anchorRef.current?.parentElement;
    if (!section) return;
    let frame = 0;
    let current = -2;

    const update = () => {
      frame = 0;
      const covers = coversIn(section);
      const middle = window.innerHeight / 2;
      let best = -1;
      let bestDistance = window.innerHeight * FOCUS_RANGE;
      covers.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const distance = Math.abs(r.top + r.height / 2 - middle);
        if (distance < bestDistance) {
          best = i;
          bestDistance = distance;
        }
      });
      if (best === current) return;
      current = best;
      covers.forEach((el, i) => (el.dataset.focused = String(i === best)));
      setFocus(best);

      // 焦点作品有封面视频：在墨里播放（减弱动画或不支持 WebGL 时不播）
      const media = best >= 0 ? featured[best] : undefined;
      const element = media?.video && supported && !reducedMotion ? coverVideo(media.id, media.video) : null;
      playOnly(element);
      if (!element) {
        setVideo({ element: null });
        return;
      }
      const box = section.getBoundingClientRect();
      setVideo({ element, rect: poolBounds(relative(covers[best], box)) });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      playOnly(null);
    };
  }, [featured, supported, reducedMotion]);

  const watch = (box: HTMLElement) => [...(box.parentElement?.querySelectorAll("[data-ink]") ?? [])];

  return (
    <>
      <span ref={anchorRef} hidden />
      {supported ? (
        <InkSurface
          className="absolute inset-0"
          tables={TABLES}
          build={buildWork(!desktop)}
          buildKey={`work:${loaded}:${desktop ? "desktop" : "mobile"}`}
          watch={watch}
          focus={focus}
          video={video}
          fallback={null}
        />
      ) : null}
    </>
  );
}
