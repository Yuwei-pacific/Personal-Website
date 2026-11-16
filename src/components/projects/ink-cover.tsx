"use client";

// 一滩墨里的封面：和首页 Work 的墨滩是同一个东西（同一套轮廓、参数）。
// 现在只用在内页结尾「下一个项目」的缩略图上。内页顶上的大封面试过放进墨里，用户否了
// （2026-11-16：内页需要项目大图完整展示），那里用的是完整的原图。
//
// 盒子就是墨滩的范围（封面按它铺满、裁成墨滩的形状）；晕画在盒子外面。
// 盒子里那张 <img>：
// - 是上传成纹理的那张图（带 crossOrigin，见 home/work/cover-media.ts 的说明），不重复下载；
// - 读屏读它的替代文字；
// - 平时透明，不支持 WebGL2 时直接显示（普通的矩形封面）；
//
// 视频（只有传了 video 才有）：在墨里播放，进入视口才播、离开就停；减弱动画时不自动播。
// 右下角留一个播放 / 暂停按钮 —— 自动播放的动态内容要能停下来。
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LuPause, LuPlay } from "react-icons/lu";

import { coverVideo } from "@/components/sections/home/work/cover-media";
import {
  POOL_PAD,
  POOL_PAD_MOBILE,
  WORK_INK,
  drawCover,
  poolPath,
} from "@/components/sections/home/work/ink-geometry";
import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };
// 晕画在盒子外面：画布四周多出这么多
const BLEED = 56;
// 盒子窄于这个宽度时用小一档的外扩（和首页手机版一致）
const SMALL_BOX = 520;

// 是否已经在浏览器里：视频元素要用 document 创建，服务端渲染时不能建
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function InkCover({
  id,
  image,
  alt,
  video,
  className,
  priority = false,
  playLabel,
  pauseLabel,
}: {
  /** 项目 id：决定墨滩轮廓的起伏（同一个项目每次一样），也是视频的缓存键 */
  id: string;
  /** 封面图的地址（Sanity CDN，允许跨域） */
  image: string;
  alt: string;
  video?: string | null;
  className?: string;
  /** 首屏的大封面：优先加载 */
  priority?: boolean;
  playLabel?: string;
  pauseLabel?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const supported = useInkSupported();
  const reducedMotion = usePrefersReducedMotion();
  const mounted = useMounted();
  const [loaded, setLoaded] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [inView, setInView] = useState(false);
  // 访客手动暂停 / 播放的选择；null = 还没动过，按默认（减弱动画时不播）
  const [wanted, setWanted] = useState<boolean | null>(null);

  useEffect(() => {
    const element = imageRef.current;
    if (!element) return;
    const onLoad = () => setLoaded(true);
    if (element.complete && element.naturalWidth) onLoad();
    else element.addEventListener("load", onLoad, { once: true });
    return () => element.removeEventListener("load", onLoad);
  }, []);

  // 盒子的尺寸（视频区域要用）与是否在视口里
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const resize = new ResizeObserver(() => setSize({ width: box.clientWidth, height: box.clientHeight }));
    resize.observe(box);
    const view = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    view.observe(box);
    return () => {
      resize.disconnect();
      view.disconnect();
    };
  }, []);

  const canPlay = Boolean(video) && supported && mounted;
  const playing = canPlay && inView && (wanted ?? !reducedMotion);
  const element = canPlay && video && (wanted ?? !reducedMotion) ? coverVideo(id, video) : null;

  useEffect(() => {
    if (!element) return;
    // 播放被拒绝（自动播放策略、低电量模式）时静默：停在静止封面上
    if (playing) element.play().catch(() => {});
    else element.pause();
    return () => element.pause();
  }, [element, playing]);

  const build = (width: number, height: number): InkSpec => {
    const pad = width < SMALL_BOX ? POOL_PAD_MOBILE : POOL_PAD;
    // poolPath 是「围绕占位外扩 pad」：先收进去 pad，墨滩正好落在盒子里
    const pool = poolPath({ x: pad, y: pad, width: width - pad * 2, height: height - pad * 2 }, id.length, pad);
    const source = imageRef.current;
    const ready = loaded && source && source.naturalWidth > 0;
    return {
      padding: { top: BLEED, right: BLEED, bottom: BLEED, left: BLEED },
      // 图没到之前什么也不画：等图到了，墨和封面一起显影，而不是先出一滩黑墨再跳出图来
      draw: (ctx) => {
        if (ready) ctx.fill(pool);
      },
      drawImage: (ctx) => {
        if (!ready) return;
        ctx.save();
        ctx.clip(pool);
        drawCover(ctx, source, { width: source.naturalWidth, height: source.naturalHeight }, { x: 0, y: 0, width, height });
        ctx.restore();
      },
      params: {
        ...WORK_INK,
        reveal: { x: width / 2, y: height / 2, radius: Math.hypot(width, height) * 0.6 },
        revealDuration: 1.4,
        revealPause: 0,
        replayReveal: true,
        // 小的那滩（下一个项目）细节经不起半分辨率
        blurScale: width < SMALL_BOX ? 1 : undefined,
      },
    };
  };

  return (
    <div ref={boxRef} data-ink={supported ? "on" : "off"} className={cn("group/cover relative", className)}>
      {/* 不用 next/image：这张图要以 CORS 方式取回、原样上传成 WebGL 纹理 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={image}
        alt={alt}
        crossOrigin="anonymous"
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className="absolute inset-0 size-full object-cover opacity-0 group-data-[ink=off]/cover:opacity-100"
      />
      {supported ? (
        <InkSurface
          className="!absolute inset-0"
          tables={TABLES}
          build={build}
          buildKey={`cover:${id}:${loaded ? "image" : "pending"}`}
          video={
            canPlay && size
              ? { element: playing ? element : null, rect: { x: 0, y: 0, width: size.width, height: size.height } }
              : undefined
          }
          fallback={null}
        />
      ) : null}
      {canPlay && playLabel && pauseLabel ? (
        <button
          type="button"
          onClick={() => setWanted(!(wanted ?? !reducedMotion))}
          aria-label={(wanted ?? !reducedMotion) ? pauseLabel : playLabel}
          className="absolute bottom-[9%] right-[7%] inline-flex size-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-opacity duration-base hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {(wanted ?? !reducedMotion) ? <LuPause aria-hidden="true" className="size-4" /> : <LuPlay aria-hidden="true" className="size-4" />}
        </button>
      ) : null}
    </div>
  );
}
