"use client";

// 人像在一滴墨里（试验，用户 2026-11-16 提的）：一滴圆圆的墨，人像显在墨芯里 —— 和首页作品的封面
// 显在墨滩里是同一个做法（InkSpec.drawImage）。照片是抠像，透明的地方就是墨：人从墨里露出来。
// 对照的另一个方案是 portrait-ink.tsx（照片原样，轮廓外面一圈墨）。
//
// 盒子略高于宽，墨画满盒子：一滩不规则的墨，不是正圆（正圆加人像就是普通的圆形头像）。
// 照片按宽度铺满、从顶部往下一点起（头在墨的上半部），超出墨的部分裁掉。
// 排版里那张 <img> 只负责加载和无障碍：WebGL 可用时它是透明的，墨里的那张才是看得见的；
// 不支持 WebGL2 时它直接显示。
import { useEffect, useRef, useState } from "react";

import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";

/** 一滩墨的轮廓：椭圆打底，半径上叠几道幅度不小的起伏 —— 左上收、右下鼓，像淌过的墨 */
function poolPath(width: number, height: number) {
  const path = new Path2D();
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.455;
  const ry = height * 0.455;
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const k =
      1 +
      0.06 * Math.sin(a + 0.6) +
      0.05 * Math.sin(a * 2 + 2.1) +
      0.035 * Math.sin(a * 3 + 4.4) +
      0.018 * Math.sin(a * 5 + 1.3);
    const x = cx + Math.cos(a) * rx * k;
    const y = cy + Math.sin(a) * ry * k;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };
// 化开的参数按 435px 宽的墨定，小的时候按比例收（不低于八成半）
const REFERENCE_SIZE = 435;
const MIN_SCALE = 0.85;

export function PortraitDrop() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const supported = useInkSupported();
  // 照片每加载完一次就加一：用来触发重画（next/image 会按 srcset 换图）
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const frame = anchorRef.current?.parentElement;
    const image = frame?.querySelector("img");
    if (!frame || !image) return;
    // 画布能用时，排版里的照片让位给墨里的那张
    frame.dataset.ink = supported ? "on" : "off";
    const onLoad = () => setLoaded((n) => n + 1);
    if (image.complete && image.naturalWidth) onLoad();
    image.addEventListener("load", onLoad);
    return () => image.removeEventListener("load", onLoad);
  }, [supported]);

  const build = (width: number, height: number, box: HTMLElement): InkSpec => {
    const k = Math.min(1, Math.max(MIN_SCALE, width / REFERENCE_SIZE));
    const loose = 14 * k;
    const pad = Math.max(56, Math.ceil(loose * 4));
    const drop = poolPath(width, height);
    const image = box.parentElement?.querySelector("img");
    return {
      padding: { top: pad, right: pad, bottom: pad, left: pad },
      draw: (ctx) => {
        ctx.fillStyle = "#000";
        ctx.fill(drop);
      },
      drawImage: (ctx) => {
        if (!image?.complete || !image.naturalWidth) return;
        ctx.save();
        ctx.clip(drop);
        // 照片比盒子略宽一点、略往下放：头顶离墨的上缘留一点墨
        const w = width * 1.04;
        const h = (image.naturalHeight / image.naturalWidth) * w;
        ctx.drawImage(image, (width - w) / 2, height * 0.09, w, h);
        ctx.restore();
      },
      params: {
        tight: 4 * k,
        loose,
        displacement: 6 * k,
        warpFrequency: 0.011 / k,
        weightFrequency: 0.006 / k,
        // 上紧下松：墨往下淌
        spreadBias: 0.7,
        reveal: { x: width * 0.5, y: height * 0.45, radius: Math.hypot(width, height) },
      },
    };
  };

  return (
    <>
      <span ref={anchorRef} hidden />
      {supported ? (
        <InkSurface className="!absolute inset-0" tables={TABLES} build={build} buildKey={`portrait-drop:${loaded}`} fallback={null} />
      ) : null}
    </>
  );
}
