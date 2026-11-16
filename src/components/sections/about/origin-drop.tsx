"use client";

// 出处那一段的一滴墨：把「加水，黑就化开」这句话直接演给人看。
// 滚到这一段之前它是一滴没遇水的墨（纯黑，只有一圈墨边）；滚到视口中间，水到了，它化开成五色；
// 滚走又收回去。用的是作品区同一套「焦点」机制（一个焦点区域，setFocus 切换），也能被鼠标划开。
// 一滴就够：整段只有这一处颜色。
//
// 减弱动画：没有水的过程，直接是化开后的静止一帧。不支持 WebGL2：退回一个纯墨色的圆。
import { useEffect, useRef, useState } from "react";

import { InkSurface, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };
// 化开的参数按标志的那一套（标志高 228 个单位），这里按墨滴的直径换算
const UNITS = 228;
// 墨滴的中心在视口的这段高度之间（占视口高度的比例）才算「水到了」
const WET_FROM = 0.12;
const WET_TO = 0.72;

/** 一滴墨的轮廓：不是正圆，半径有几道缓慢的起伏 */
function dropPath(size: number) {
  const path = new Path2D();
  const c = size / 2;
  const r = size * 0.43;
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const k = 1 + 0.055 * Math.sin(a * 2 + 0.9) + 0.035 * Math.sin(a * 3 + 2.4) + 0.02 * Math.sin(a * 5 + 4.1);
    const x = c + Math.cos(a) * r * k;
    const y = c + Math.sin(a) * r * k;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

function build(width: number, height: number): InkSpec {
  const size = Math.min(width, height);
  const u = size / UNITS;
  const pad = Math.max(56, Math.ceil(15 * u * 4));
  return {
    padding: { top: pad, right: pad, bottom: pad, left: pad },
    draw: (ctx) => {
      ctx.fillStyle = "#000";
      ctx.fill(dropPath(size));
    },
    params: {
      tight: 4 * u,
      loose: 15 * u,
      displacement: 5 * u,
      warpFrequency: 0.011 / u,
      weightFrequency: 0.005 / u,
      // 上紧下松：墨往下淌
      spreadBias: 0.7,
      reveal: null,
      focusRegions: [{ x: 0, y: 0, width, height }],
    },
  };
}

export function OriginDrop({ className }: { className?: string }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [wet, setWet] = useState(false);

  useEffect(() => {
    const box = anchorRef.current?.nextElementSibling;
    if (!box) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = box.getBoundingClientRect();
      const middle = (r.top + r.height / 2) / window.innerHeight;
      setWet(middle > WET_FROM && middle < WET_TO);
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
    };
  }, []);

  return (
    <>
      <span ref={anchorRef} hidden />
      <InkSurface
        className={className}
        tables={TABLES}
        build={build}
        buildKey="origin-drop"
        focus={wet || reducedMotion ? 0 : -1}
        fallback={<div className="absolute inset-[7%] rounded-full bg-design-light-text-primary" />}
      />
    </>
  );
}
