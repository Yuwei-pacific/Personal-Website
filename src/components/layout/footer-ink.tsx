"use client";

// 页脚的墨（用户选的方向「落款」+「一池墨」）：
//
//   邮箱
//   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮      墨线：从左缘进来，就是邮箱下面那道分割线，
//   Site   Elsewhere   Based in         ╰▟◣    到标志跟前一拐，落进「i」那一笔停住
//
// 两块画布叠在一起，都铺满页脚：
// - 墨池：整块页脚是一池静止的墨，颜色和页脚的底色一样，平时看不出来。鼠标（或手指）划过，
//   墨被划开一道口子，口子边缘带一圈彩边，几秒后合拢。访客就是「水」。
// - 落款：墨线和标志。平时是素墨（不化开）；鼠标靠近标志时，标志和线的末端才化开，移开后收回去。
//   没有悬停的设备（触屏）上，标志滚进视口就化开。减弱动画时一直是素墨。
//
// 页脚是全站唯一反转的区块，所以两块画布的查找表正好相反：墨池要和页脚底色一样（浅色模式下是墨），
// 用当前主题的表；墨线和标志要和底色相反（浅色模式下是纸色的芯），用另一个主题的表。
//
// 位置从页脚里的两个占位读：FooterLineSlot（线画在它的竖向中线上）和 FooterMarkSlot（墨迹框）。
import { useEffect, useRef, useState } from "react";

import { WORK_INK, footerThread, strokeBand, strokeCore } from "@/components/sections/home/work/ink-geometry";
import { MARK_BOX, drawMark, markParams, markStemX } from "@/components/ui/ink-mark";
import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES, MARK_PATHS } from "@/components/ui/ink/ink-tables";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const POOL_TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };
const SIGNATURE_TABLES = { light: COLOR_TABLES.dark, dark: COLOR_TABLES.light };

// 鼠标离标志多近算「靠近」（CSS px，按到墨迹框边缘的距离）
const NEAR = 180;
// 墨线落在「i」竖笔的哪个高度（墨迹框高度的比例）：竖笔上段，点的下面
const STEM_AT = 0.36;
// 墨线的晕按标志的尺度收：首屏标志每单位约 2.6px，页脚的标志小得多
const HERO_UNIT = 2.6;

const slotsIn = (box: HTMLElement) => ({
  line: box.parentElement?.querySelector<HTMLElement>('[data-ink="footer-line"]') ?? null,
  mark: box.parentElement?.querySelector<HTMLElement>('[data-ink="footer-mark"]') ?? null,
});

function relative(element: Element | null, box: DOMRect) {
  if (!element) return null;
  const r = element.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return { x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height };
}

// 墨池：整块填满墨。没有形状，也就没有晕，模糊在很低的分辨率上算就够了
function buildPool(): InkSpec {
  return {
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    draw: (ctx, width, height) => ctx.fillRect(0, 0, width, height),
    params: { ...WORK_INK, reveal: null, maxDpr: 1.5, blurScale: 0.25 },
  };
}

function buildSignature(width: number, height: number, box: HTMLElement): InkSpec {
  const boxRect = box.getBoundingClientRect();
  const slots = slotsIn(box);
  const line = relative(slots.line, boxRect);
  const mark = relative(slots.mark, boxRect);
  const u = mark ? mark.height / MARK_BOX.height : 1;
  const lineY = line ? line.y + line.height / 2 : height * 0.4;
  const endY = mark ? mark.y + mark.height * STEM_AT : 0;
  const thread = footerThread(width, lineY, mark ? { x: markStemX(mark, u, endY), y: endY } : null);
  const scale = Math.min(1, Math.max(0.4, u / HERO_UNIT));

  return {
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    draw: (ctx) => {
      // 先画线的晕带，再画标志：交接处标志的墨盖在晕带上面（与首屏一样）
      strokeBand(ctx, thread, scale);
      ctx.fillStyle = "#000";
      if (mark) drawMark(ctx, mark.x, mark.y, u);
    },
    drawCore: (ctx) => strokeCore(ctx, thread, scale),
    params: {
      ...markParams(u),
      reveal: null,
      // 只有标志这一处会化开（连带线的末端）；焦点由 FooterInk 按鼠标远近切换
      focusRegions: mark ? [mark] : [{ x: -1e6, y: -1e6, width: 1, height: 1 }],
    },
  };
}

const watchSlots = (box: HTMLElement) => {
  const { line, mark } = slotsIn(box);
  return [line, mark];
};

/** 页脚的两块化开画布，铺满父元素。不支持 WebGL 时不渲染，占位自己显示静态的线和标志 */
export function FooterInk() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const supported = useInkSupported();
  const reducedMotion = usePrefersReducedMotion();
  const [near, setNear] = useState(false);

  useEffect(() => {
    const mark = anchorRef.current?.parentElement?.querySelector<HTMLElement>('[data-ink="footer-mark"]');
    if (!mark || !supported || reducedMotion) return;

    // 触屏没有「靠近」：标志大半滚进视口就化开，滚走收回
    if (!window.matchMedia("(hover: hover)").matches) {
      const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { threshold: 0.75 });
      observer.observe(mark);
      return () => {
        observer.disconnect();
        setNear(false);
      };
    }

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const update = () => {
      frame = 0;
      if (!pointer) return;
      const r = mark.getBoundingClientRect();
      const dx = Math.max(r.left - pointer.x, 0, pointer.x - r.right);
      const dy = Math.max(r.top - pointer.y, 0, pointer.y - r.bottom);
      setNear(Math.hypot(dx, dy) < NEAR);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const move = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    window.addEventListener("pointermove", move, { passive: true });
    // 鼠标不动、页面在滚：标志自己滚到鼠标底下也算靠近
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
      setNear(false);
    };
  }, [supported, reducedMotion]);

  return (
    <>
      <span ref={anchorRef} hidden />
      {supported ? (
        <>
          <InkSurface className="absolute inset-0" tables={POOL_TABLES} build={buildPool} buildKey="footer-pool" fallback={null} />
          <InkSurface
            className="absolute inset-0"
            tables={SIGNATURE_TABLES}
            build={buildSignature}
            buildKey="footer-signature"
            watch={watchSlots}
            focus={near ? 0 : -1}
            fallback={null}
          />
        </>
      ) : null}
    </>
  );
}

/** 墨线的占位：线画在这一行的竖向中线上。不支持 WebGL 时显示一道普通的细线 */
export function FooterLineSlot({ className }: { className?: string }) {
  const supported = useInkSupported();
  return (
    <div data-ink="footer-line" aria-hidden="true" className={cn("relative", className)}>
      {supported ? null : <span className="absolute inset-x-0 top-1/2 h-px bg-design-dark-text-primary" />}
    </div>
  );
}

// 单色标志的 viewBox = 墨迹框换算回路径坐标（路径 ×6.6 再平移 210,27 后落在 MARK_BOX 里）
const MARK_VIEWBOX = [
  (MARK_BOX.x - 210) / 6.6,
  (MARK_BOX.y - 27) / 6.6,
  MARK_BOX.width / 6.6,
  MARK_BOX.height / 6.6,
].join(" ");

/** 标志的占位：盒子 = 墨迹框。不支持 WebGL 时显示单色的 SVG 标志 */
export function FooterMarkSlot({ className, label }: { className?: string; label: string }) {
  const supported = useInkSupported();
  return (
    <div data-ink="footer-mark" role="img" aria-label={label} className={cn("aspect-[196/228]", className)}>
      {supported ? null : (
        <svg viewBox={MARK_VIEWBOX} aria-hidden="true" className="size-full fill-current">
          {MARK_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      )}
    </div>
  );
}
