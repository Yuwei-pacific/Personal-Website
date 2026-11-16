"use client";

// 人像外面那一圈墨：贴着人的轮廓化开（用户 2026-11-16：深色模式下黑衬衫和墨底融在一起，
// 只剩脸和手 —— 给人像一圈彩色墨迹）。
// 第一版只有 2 / 7 px、均匀的一圈，用户嫌它没有呼吸感、比不上作品区的墨滩：那是描边，不是墨。
// 现在用作品区那一档的参数（紧 3 / 松 12，起伏更大），再加上紧下松 —— 头和肩收得紧，往下淌得开；
// 紧和松差得多，呼吸（两档之间来回）才看得出来。
//
// 画布垫在照片下面：形状是照片的剪影（取照片自己的透明通道），化开后只有溢出轮廓的那一圈看得见，
// 剪影里面被照片盖住。所以照片本身原样、不加颗粒（品牌手册 04：作品图片保持原样）。
// 人像的右缘和下缘是被相框裁掉的（下缘站在线上），所以画布右、下不留余量：晕也在那里齐齐裁断，
// 不会渗到线的下面去。
//
// 不支持 WebGL2 时什么也不画，照片照常显示。
import { useEffect, useRef, useState } from "react";

import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { COLOR_TABLES } from "@/components/ui/ink/ink-tables";

const TABLES = { light: COLOR_TABLES.light, dark: COLOR_TABLES.dark };
// 晕的两档宽度（CSS px）：和首页作品的墨滩（3 / 10）同一档
const TIGHT = 3;
const LOOSE = 12;
// 画布在盒子左、上多出的余量：装得下晕、边缘的起伏和被鼠标推出去的墨
const BLEED = 64;
// 上面的宽度是按宽屏的人像（约 435px 宽）定的；人像小的时候晕略收一点。
// 只能略收：试过按比例收到 0.6，窄屏上只剩一道细边，用户的反应是「墨怎么没了」（2026-11-16）
const REFERENCE_WIDTH = 435;
const MIN_SCALE = 0.85;
// 剪影按 2 倍画，轮廓才不会发虚
const SCALE = 2;

/** 照片的剪影：与 object-cover + object-top 同样的裁法（照片比相框更窄长，所以按宽度铺满、从顶部起） */
function silhouette(image: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * SCALE);
  canvas.height = Math.ceil(height * SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const drawnHeight = (image.naturalHeight / image.naturalWidth) * canvas.width;
  ctx.drawImage(image, 0, 0, canvas.width, drawnHeight);
  // 只留透明通道，颜色全部换成墨
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export function PortraitInk() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const supported = useInkSupported();
  // 照片每加载完一次就加一：用来触发重画
  const [loaded, setLoaded] = useState(0);

  // 照片加载好了才有剪影可画。不能只听第一次：窗口变窄 / 变宽（或手机转屏）时 next/image 会按 srcset
  // 换一张尺寸合适的图，换图的那一刻 complete 是 false —— 这时正好赶上尺寸变化的重画，剪影是空的，
  // 墨就没了；所以每次 load 都要再重画一遍
  useEffect(() => {
    const image = anchorRef.current?.parentElement?.querySelector("img");
    if (!image) return;
    const onLoad = () => setLoaded((n) => n + 1);
    if (image.complete && image.naturalWidth) onLoad();
    image.addEventListener("load", onLoad);
    return () => image.removeEventListener("load", onLoad);
  }, []);

  const build = (width: number, height: number, box: HTMLElement): InkSpec => {
    const image = box.parentElement?.querySelector("img");
    const shape = image?.complete && image.naturalWidth ? silhouette(image, width, height) : null;
    const k = Math.min(1, Math.max(MIN_SCALE, width / REFERENCE_WIDTH));
    return {
      padding: { top: BLEED, right: 0, bottom: 0, left: BLEED },
      draw: (ctx) => {
        if (shape) ctx.drawImage(shape, 0, 0, width, height);
      },
      params: {
        tight: TIGHT * k,
        loose: LOOSE * k,
        displacement: 6 * k,
        warpFrequency: 0.011 / k,
        // 人像只有几百 px 宽：紧 / 松交替的尺度取小一点，一圈里才有好几处收和放
        weightFrequency: 0.009 / k,
        spreadBias: 0.6,
        // 水从胸口落下，往四周漫开
        reveal: { x: width * 0.5, y: height * 0.6, radius: Math.hypot(width, height) },
        // 头发丝、指缝这些细处经不起半分辨率
        blurScale: 1,
      },
    };
  };

  return (
    <>
      <span ref={anchorRef} hidden />
      {supported ? (
        <InkSurface
          className="!absolute inset-0"
          tables={TABLES}
          build={build}
          buildKey={`portrait:${loaded}`}
          fallback={null}
        />
      ) : null}
    </>
  );
}
