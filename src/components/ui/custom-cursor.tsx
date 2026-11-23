"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animation/gsap";

// 墨点光标。参数是在对比页里和旧方块、标志的 i 点并排试过后定下的（2026-11-23）。
// 它不是墨：没有晕、没有颜色，只是一个边缘略不规则的纸色点，用差值混合把底下的内容反过来 ——
// 纸上是黑点、墨上是白点，页脚、lightbox、深浅两种主题都不用单独处理。
const DOT_SIZE = 20; // 墨芯直径（px）
const EDGE_BAND = 0.2; // 墨芯外一圈稀疏散点的宽度，占半径的比例
const FOLLOW_MS = 50; // 追上鼠标大约用的时间
const STRETCH = 0.35; // 快速移动时顺着方向拉长的程度（0–1），停下时带一点回弹
const HOVER_SCALE = 2.2; // 悬停在可交互元素上放大；圆里的字被整块反色，仍然看得清
const PRESS_SCALE = 0.82; // 按下时略收
const INTERACTIVE = "a, button, input, textarea, select, .cursor-hover, [role='button']";

// 固定种子的随机数：每次加载都是同一个形状
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 墨点的 alpha 蒙版：几个正弦叠出的不规则圆边 + 边外一圈稀疏散点。只在挂载时画一次。 */
function buildMask(dpr: number) {
  const rc = DOT_SIZE / 2;
  const band = rc * EDGE_BAND;
  const box = Math.ceil(2 * (rc * 1.12 + band) + 4);
  const size = Math.round(box * dpr);
  const mask = document.createElement("canvas");
  mask.width = size;
  mask.height = size;
  const ctx = mask.getContext("2d");
  if (!ctx) return null;

  const img = ctx.createImageData(size, size);
  const data = img.data;
  const rnd = mulberry32(11);
  const p1 = rnd() * 6.283;
  const p2 = rnd() * 6.283;
  const p3 = rnd() * 6.283;
  // 散点按约 1 个 CSS 像素一格取舍
  const cell = Math.max(1, Math.round(dpr));
  const cols = Math.ceil(size / cell);
  const cellRandom = new Float32Array(cols * cols);
  for (let i = 0; i < cellRandom.length; i++) cellRandom[i] = rnd();

  const half = box / 2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5) / dpr - half;
      const y = (py + 0.5) / dpr - half;
      const r = Math.hypot(x, y);
      const angle = Math.atan2(y, x);
      const edge =
        rc *
        (1 +
          0.07 * Math.sin(2 * angle + p1) +
          0.045 * Math.sin(3 * angle + p2) +
          0.03 * Math.sin(5 * angle + p3));
      // 墨芯：边缘约 1.4 个设备像素的抗锯齿
      let alpha = Math.min(1, Math.max(0, (edge - r) * dpr * 0.75 + 0.5));
      const t = (r - edge) / band;
      if (t > 0 && t < 1) {
        const chance = Math.pow(1 - t, 1.9) * 0.8;
        if (cellRandom[((py / cell) | 0) * cols + ((px / cell) | 0)] < chance) {
          alpha = Math.max(alpha, 0.92);
        }
      }
      data[(py * size + px) * 4 + 3] = alpha * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { mask, box, size };
}

export function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 只给真正的鼠标用；减少动态效果时整个不出现（系统光标不受影响）
    if (window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sprite = buildMask(Math.min(3, window.devicePixelRatio || 1));
    if (!sprite) return;
    canvas.width = sprite.size;
    canvas.height = sprite.size;
    canvas.style.width = `${sprite.box}px`;
    canvas.style.height = `${sprite.box}px`;

    // 差值混合下必须是浅色才能在任何底色上反出来；用不随主题变的纸色，所以只上一次色
    const paper = getComputedStyle(document.documentElement).getPropertyValue("--color-paper").trim();
    ctx.drawImage(sprite.mask, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = `hsl(${paper})`;
    ctx.fillRect(0, 0, sprite.size, sprite.size);
    ctx.globalCompositeOperation = "source-over";

    // 位置、速度、拉长（a）、朝向、缩放（s）、透明度
    const st = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, a: 0, va: 0, angle: 0, s: 1, vs: 0, op: 0 };
    let hasPositioned = false;
    let isVisible = false;
    let isInteractive = false;
    let isPressed = false;
    let running = false;

    const followTau = FOLLOW_MS / 1000 / 3;

    const render = () => {
      const sx = st.s * (1 + st.a);
      const sy = st.s / (1 + st.a);
      canvas.style.transform =
        `translate3d(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px, 0) translate(-50%, -50%) ` +
        `rotate(${st.angle.toFixed(4)}rad) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      canvas.style.opacity = st.op.toFixed(3);
    };

    // 只在有东西要动时挂在 GSAP 的 ticker 上，停稳了就摘下来
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(0.05, Math.max(deltaMs / 1000, 0.001));

      const px = st.x;
      const py = st.y;
      const follow = 1 - Math.exp(-dt / followTau);
      st.x += (st.tx - st.x) * follow;
      st.y += (st.ty - st.y) * follow;
      const blend = 1 - Math.exp(-dt / 0.035);
      st.vx += ((st.x - px) / dt - st.vx) * blend;
      st.vy += ((st.y - py) / dt - st.vy) * blend;

      // 拉长：弹簧追着速度给出的目标，停下时稍微回弹一下
      const speed = Math.hypot(st.vx, st.vy);
      const stretchTarget = STRETCH * 0.85 * Math.tanh(speed / 1500);
      st.va += (18 * 18 * (stretchTarget - st.a) - 2 * 0.42 * 18 * st.va) * dt;
      st.a += st.va * dt;
      if (speed > 40) {
        const diff = Math.atan2(st.vy, st.vx) - st.angle;
        st.angle += Math.atan2(Math.sin(diff), Math.cos(diff)) * (1 - Math.exp(-dt / 0.03));
      }

      const scaleTarget = (isInteractive ? HOVER_SCALE : 1) * (isPressed ? PRESS_SCALE : 1);
      st.vs += (15 * 15 * (scaleTarget - st.s) - 2 * 0.55 * 15 * st.vs) * dt;
      st.s += st.vs * dt;

      const opacityTarget = isVisible ? 1 : 0;
      st.op += (opacityTarget - st.op) * (1 - Math.exp(-dt / 0.08));

      const settled =
        Math.abs(st.tx - st.x) < 0.05 &&
        Math.abs(st.ty - st.y) < 0.05 &&
        speed < 1 &&
        Math.abs(st.a) < 0.001 &&
        Math.abs(st.va) < 0.001 &&
        Math.abs(scaleTarget - st.s) < 0.001 &&
        Math.abs(st.vs) < 0.001 &&
        Math.abs(opacityTarget - st.op) < 0.002;

      if (settled) {
        Object.assign(st, { x: st.tx, y: st.ty, vx: 0, vy: 0, a: 0, va: 0, s: scaleTarget, vs: 0, op: opacityTarget });
        gsap.ticker.remove(tick);
        running = false;
      }
      render();
    };

    const wake = () => {
      if (running) return;
      running = true;
      gsap.ticker.add(tick);
    };

    // 只跟随真正的鼠标。用 pointer 事件而不是 mouse 事件：触屏点一下，浏览器会补发一组
    // 模拟的 mousemove，墨点就会出现在点击处并一直停在那里 —— 接了触控板或键盘的 iPad
    // 主指针是 fine，上面的 (pointer: coarse) 拦不住它。
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      st.tx = e.clientX;
      st.ty = e.clientY;
      if (!hasPositioned) {
        // 第一次直接落在鼠标处，不从角落飞进来
        st.x = st.tx;
        st.y = st.ty;
        hasPositioned = true;
      }
      isVisible = true;
      wake();
    };

    const onPointerDown = (e: PointerEvent) => {
      // 混合输入设备上改用手指或触控笔时，把墨点收起来，不留在最后的鼠标位置
      if (e.pointerType !== "mouse") {
        if (!isVisible) return;
        isVisible = false;
        hasPositioned = false;
        st.op = 0;
        render();
        return;
      }
      isPressed = true;
      wake();
    };

    const onPointerUp = () => {
      if (!isPressed) return;
      isPressed = false;
      wake();
    };

    // 指针离开窗口
    const onPointerOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      isVisible = false;
      isPressed = false;
      wake();
    };

    const onPointerOver = (e: PointerEvent) => {
      const nextIsInteractive = e.target instanceof Element && Boolean(e.target.closest(INTERACTIVE));
      if (nextIsInteractive === isInteractive) return;
      isInteractive = nextIsInteractive;
      wake();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("pointerover", onPointerOver);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-cursor hidden md:block"
      style={{ opacity: 0, willChange: "transform, opacity", mixBlendMode: "difference" }}
    />
  );
}
