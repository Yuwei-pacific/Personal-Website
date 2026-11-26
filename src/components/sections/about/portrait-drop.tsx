"use client";

// 人像在一滴墨里（试验，用户 2026-11-16 提的）：一滴圆圆的墨，人像显在墨芯里 —— 和首页作品的封面
// 显在墨滩里是同一个做法（InkSpec.drawImage）。照片是抠像，透明的地方就是墨：人从墨里露出来。
// 对照过的另一个方案是照片原样、只在轮廓外面画一圈墨：用户比较后选了这个，那个文件已删（git 历史里有）。
//
// 盒子略高于宽，墨画满盒子：一滩不规则的墨，不是正圆（正圆加人像就是普通的圆形头像）。
// 照片按宽度铺满、从顶部往下一点起（头在墨的上半部），超出墨的部分裁掉。
// 排版里那张 <img> 只负责加载和无障碍：WebGL 可用时它是透明的，墨里的那张才是看得见的；
// 不支持 WebGL2 时它直接显示。
import { useEffect, useRef, useState } from "react";

import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { INK_TABLES } from "@/components/ui/ink/ink-tables";

/**
 * 一滩墨的轮廓：椭圆打底，半径上叠几道幅度不小的起伏 —— 左上收、右下鼓，像淌过的墨。
 * 算完之后把轮廓拉到正好撑满盒子（外接框 = 盒子）：这样排版时拿盒子去对齐，对上的就是墨本身的边，
 * 而不是墨四周一圈看不见的空（之前墨比盒子小一圈，人像的左缘和顶都对不上旁边的字）
 */
function blobPath(width: number, height: number) {
  const steps = 120;
  const points: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const k =
      1 +
      0.06 * Math.sin(a + 0.6) +
      0.05 * Math.sin(a * 2 + 2.1) +
      0.035 * Math.sin(a * 3 + 4.4) +
      0.018 * Math.sin(a * 5 + 1.3);
    points.push([Math.cos(a) * k, Math.sin(a) * k]);
  }
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const path = new Path2D();
  points.forEach(([x, y], i) => {
    const px = ((x - minX) / (maxX - minX)) * width;
    const py = ((y - minY) / (maxY - minY)) * height;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  });
  path.closePath();
  return path;
}

// 化开的参数按 435px 宽的墨定，小的时候按比例收（不低于八成半）
const REFERENCE_SIZE = 435;
const MIN_SCALE = 0.85;

export function PortraitDrop() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const supported = useInkSupported();
  const [inkUnavailable, setInkUnavailable] = useState(false);
  const inkActive = supported && !inkUnavailable;
  // 照片每加载完一次就加一：用来触发重画（next/image 会按 srcset 换图）
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const frame = anchorRef.current?.parentElement;
    const image = frame?.querySelector("img");
    if (!frame || !image) return;
    // 画布能用时，排版里的照片让位给墨里的那张；不支持或上下文丢失时显出原照片
    frame.dataset.ink = inkActive ? "on" : "off";
    const onLoad = () => setLoaded((n) => n + 1);
    if (image.complete && image.naturalWidth) onLoad();
    image.addEventListener("load", onLoad);
    return () => image.removeEventListener("load", onLoad);
  }, [inkActive]);

  const build = (width: number, height: number, box: HTMLElement): InkSpec => {
    const k = Math.min(1, Math.max(MIN_SCALE, width / REFERENCE_SIZE));
    const loose = 14 * k;
    const pad = Math.max(56, Math.ceil(loose * 4));
    const drop = blobPath(width, height);
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
        <InkSurface
          className="!absolute inset-0"
          tables={INK_TABLES}
          build={build}
          buildKey={`portrait-drop:${loaded}`}
          onUnavailableChange={setInkUnavailable}
          fallback={null}
        />
      ) : null}
    </>
  );
}
