"use client";

// 02 标志：作图动画。跟着滚动走：圆心 → 六个圆 → 几条直线 → 按笔顺填上笔画 → 四刀切开 → 辅助线收起 →
// 几何版变成墨迹版，同时化开。画完以后就是那个活的标志：会流动、会呼吸，鼠标划过能把墨搅开。
//
// 这块图版在滚动时钉在屏幕中间（position: sticky），外面一层比它高出一段「行程」，滚过行程的前 82% 动画走完，
// 剩下的一段画面停住，留给人划。各段互相叠着走，前一段还没停后一段已经起步，中间没有停顿。
//
// 作图的部分是普通矢量（SVG）；从变形开始交给墨的画布（ui/ink）：每一帧把当时的形状重画成源图，
// 化开的强度跟着进度从 0 推到手册里的数值。到头以后不再重画，渲染器自己流动。
// 这是全页唯一活的墨（手册 07：一屏最多一处化开）。
//
// 减少动态效果：不钉住、不走行程，直接是画完的标志（静止的一帧）。
// 没有 WebGL2：变形用 SVG 做完，最后换成静态的化开（ui/ink/ink-fallback）。
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { markPadding, markParams } from "@/components/ui/ink-mark";
import { InkSurface, useInkSupported, type InkSpec } from "@/components/ui/ink/ink-surface";
import { INK_TABLES, MARK_BOUNDS, MARK_INK_BOX, MARK_PATH, MARK_USER_SIZE } from "@/components/ui/ink/ink-tables";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { gsap } from "@/lib/animation/scroll-trigger";
import { cn } from "@/lib/utils";

const InkMarkSvg = dynamic(() => import("@/components/ui/ink/ink-fallback").then((m) => m.InkMarkSvg), { ssr: false });

// ── 方格 ──
// 作图画在 22 × 22 的方格上，一格是半个笔画；圆心在 (11, 14)，六个同心圆的半径是 3、5、6、8、9、11 格
// （手册 02「怎么切出来的」）。
const C = { x: 11, y: 14 };
const RADII = [3, 5, 6, 8, 9, 11];
// 直线辅助线：一横的上下边、一竖的左右边、两条腿的内外边。[x1, y1, x2, y2]，从第一个点长向第二个点
const LINES = [
  [3, 0, 19, 0],
  [3, 2, 19, 2],
  [10, 0, 10, 22],
  [12, 0, 12, 22],
  [0, 14, 0, 22],
  [2, 14, 2, 22],
  [22, 14, 22, 22],
  [20, 14, 20, 22],
] as const;
// 四刀：从圆心出发的半径，终点在最外的圆外面一点
const CUT_ENDS = [
  [2.733, 4.758],
  [19.267, 4.758],
  [6.867, 2.309],
  [15.133, 2.309],
] as const;
// 切口离竖直方向的角度：中间那圈 asin(2/6)，里面那圈 asin(3.333/5)。弧从水平画到竖直是 90°，切完剩下这么多
const CUT_MID_DEG = 19.471;
const CUT_IN_DEG = 41.81;

// 方格和墨迹版路径（ink-tables.ts 的 MARK_PATH）之间的换算，和手册里几何版叠在墨迹版上的那组数是同一个：
// 墨迹坐标 = INK_ORIGIN + 格数 × INK_PER_CELL
const INK_PER_CELL = 1.570635;
const INK_ORIGIN = { x: 8.723, y: 10.477 };
const CELL_PER_INK = 1 / INK_PER_CELL;
// 墨迹的外框，按格算。SVG 的 viewBox 和墨的盒子都取它，两边的坐标才对得上
const BOX = {
  x: (MARK_BOUNDS.x - INK_ORIGIN.x) * CELL_PER_INK,
  y: (MARK_BOUNDS.y - INK_ORIGIN.y) * CELL_PER_INK,
  width: MARK_BOUNDS.width * CELL_PER_INK,
  height: MARK_BOUNDS.height * CELL_PER_INK,
};
const INK_TO_GRID = `scale(${CELL_PER_INK}) translate(${-INK_ORIGIN.x} ${-INK_ORIGIN.y})`;

// ── 行程和手感 ──
// 钉住以后再滚多远（视口高度的倍数），其中前多少用来走完动画（剩下的画面停住）
// 起初是 2.2 屏，用户嫌太长（2026-11-27）
const TRAVEL_SCREENS = 1.5;
const TRAVEL_USED = 0.82;
// 画面追滚动的滞后：0 = 贴着滚动，越接近 1 越滞后、越顺。按时间算，不同刷新率手感一样
const SMOOTH = 0.82;
// 时间轴的总长：作图到 0.88，变形从 0.82 起；化开和变形同时开始，一直到 1.16
const END = 1.16;
const MORPH_FROM = 0.82;

// ── 缓动 ──
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const sine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - Math.pow(1 - t, 3);
const outQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const f = (n: number) => n.toFixed(3);

// ── 几何版 → 墨迹版：真的变形，不是两张图叠着换 ──
// 两条轮廓各取一圈点，一一对上（几何版轮廓上的每个点，对到墨迹版轮廓上离它最近、且顺序不乱的那个点），
// 中间的形状就是每对点之间的插值：直角慢慢变圆，直边慢慢变成手写的边。
type Point = [number, number];
type Morph = { a: Point[]; b: Point[] }[];

function buildMorph(svg: SVGSVGElement): Morph | null {
  // 几何版轮廓上每隔 0.2 格取一个点；转角一定取到，起始那一帧才和几何版分毫不差
  const STEP = 0.2;
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / STEP));
    return Array.from({ length: n }, (_, i): Point => [x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
  };
  const at = (r: number, a: number): Point => [C.x + r * Math.cos(a), C.y + r * Math.sin(a)];
  const arc = (r: number, a0: number, a1: number) => {
    const n = Math.max(1, Math.round((Math.abs(a1 - a0) * r) / STEP));
    return Array.from({ length: n }, (_, i) => at(r, a0 + ((a1 - a0) * i) / n));
  };
  const PI = Math.PI;
  const rad = (deg: number) => (deg * PI) / 180;
  // 一竖的两条边和内外两个圆相交的地方
  const yo = C.y - Math.sqrt(121 - 1);
  const yi = C.y - Math.sqrt(81 - 1);
  const ao = Math.atan2(yo - C.y, 1);
  const ai = Math.atan2(yi - C.y, 1);
  // 一横 + 外框 + 一竖 连成的一整块，顺时针
  const main = [
    line(3, 0, 19, 0),
    line(19, 0, 19, 2),
    line(19, 2, 12, 2),
    line(12, 2, 12, yo),
    arc(11, ao, 0),
    line(22, 14, 22, 22),
    line(22, 22, 20, 22),
    line(20, 22, 20, 14),
    arc(9, 0, ai),
    line(12, yi, 12, 22),
    line(12, 22, 10, 22),
    line(10, 22, 10, yi),
    arc(9, -PI - ai, -PI),
    line(2, 14, 2, 22),
    line(2, 22, 0, 22),
    line(0, 22, 0, 14),
    arc(11, -PI, -PI - ao),
    line(10, yo, 10, 2),
    line(10, 2, 3, 2),
    line(3, 2, 3, 0),
  ].flat();
  // 四段弧：外圆、切口、内圆、底边
  const piece = (ro: number, ri: number, side: -1 | 1, cutDeg: number) => {
    const a0 = side < 0 ? -PI : 0;
    const a1 = side < 0 ? rad(-90 - cutDeg) : rad(-90 + cutDeg);
    return [arc(ro, a0, a1), line(...at(ro, a1), ...at(ri, a1)), arc(ri, a1, a0), line(...at(ri, a0), ...at(ro, a0))].flat();
  };
  const geo = [
    main,
    piece(8, 6, -1, CUT_MID_DEG),
    piece(8, 6, 1, CUT_MID_DEG),
    piece(5, 3, -1, CUT_IN_DEG),
    piece(5, 3, 1, CUT_IN_DEG),
  ];

  // 墨迹版：五段子路径各取密密的一圈点，换算到方格坐标
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
  probe.style.visibility = "hidden";
  svg.appendChild(probe);
  const ink = (MARK_PATH.match(/M[^M]+/g) ?? []).map((d) => {
    probe.setAttribute("d", d);
    const length = probe.getTotalLength();
    const n = Math.max(400, Math.round((length * CELL_PER_INK) / 0.03));
    return Array.from({ length: n }, (_, i): Point => {
      const q = probe.getPointAtLength((length * i) / n);
      return [(q.x - INK_ORIGIN.x) * CELL_PER_INK, (q.y - INK_ORIGIN.y) * CELL_PER_INK];
    });
  });
  probe.remove();
  if (ink.length !== geo.length) return null;

  const area = (pts: Point[]) =>
    pts.reduce((sum, a, i) => {
      const b = pts[(i + 1) % pts.length];
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0);
  const middle = (pts: Point[]) =>
    pts.reduce<Point>((sum, a) => [sum[0] + a[0] / pts.length, sum[1] + a[1] / pts.length], [0, 0]);
  const d2 = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

  const rest = ink.slice();
  return geo.map((a) => {
    // 哪段对哪段：重心最近的
    const centre = middle(a);
    let which = 0;
    rest.forEach((pts, i) => {
      if (d2(middle(pts), centre) < d2(middle(rest[which]), centre)) which = i;
    });
    let source = rest.splice(which, 1)[0];
    if (Math.sign(area(source)) !== Math.sign(area(a))) source = source.slice().reverse();
    // 起点：离几何版第一个点最近的；之后只往前找，不回头
    const count = source.length;
    const reach = Math.ceil((count / a.length) * 5);
    let j = 0;
    source.forEach((q, i) => {
      if (d2(q, a[0]) < d2(source[j], a[0])) j = i;
    });
    const b: Point[] = [source[j]];
    let used = 0;
    for (let i = 1; i < a.length; i++) {
      let best = 0;
      let nearest = Infinity;
      for (let k = 0; k <= reach && used + k < count; k++) {
        const distance = d2(source[(j + k) % count], a[i]);
        if (distance < nearest) {
          nearest = distance;
          best = k;
        }
      }
      j = (j + best) % count;
      used += best;
      b.push(source[j]);
    }
    return { a, b };
  });
}

function morphPath(morph: Morph, t: number) {
  let d = "";
  for (const { a, b } of morph) {
    for (let i = 0; i < a.length; i++) {
      d += `${i ? "L" : "M"}${f(a[i][0] + (b[i][0] - a[i][0]) * t)} ${f(a[i][1] + (b[i][1] - a[i][1]) * t)}`;
    }
    d += "Z";
  }
  return d;
}

// 线宽按屏幕像素算（图放大缩小线都一样细）。vector-effect 不继承，用这个类一次给到组里每个图形。
// 实心的笔画不能加：它们靠 pathLength 一点点画出来，线宽按屏幕算的时候虚线长度也按屏幕算，会断成几截
const HAIRLINES = "[&_*]:[vector-effect:non-scaling-stroke]";

// 叠在墨的盒子上的一层 SVG
const LAYER = "pointer-events-none absolute inset-0 h-full w-full overflow-visible";

export function MarkMotion({ caption, hint, label }: { caption: string; hint: string; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const supported = useInkSupported();
  const [glLost, setGlLost] = useState(false);
  const glOff = !supported || glLost;
  // 画完了：提示出现；没有 WebGL 时换成静态的化开
  const [done, setDone] = useState(false);

  // 墨的画布此刻该画什么：tInk < 0 = 什么都不画；否则画变形到 tInk 的形状，化开到 strength。
  // 放在 ref 里：每帧都变，不经过 React 渲染
  const live = useRef<{ tInk: number; strength: number; morph: Morph | null }>({ tInk: -1, strength: 0, morph: null });
  const relayout = useRef<(() => void) | null>(null);
  const onRelayout = useCallback((fn: (() => void) | null) => {
    relayout.current = fn;
  }, []);

  // 渲染循环里要读最新的值，又不想因为它变了就重建整个循环
  const glOffRef = useRef(glOff);
  useEffect(() => {
    glOffRef.current = glOff;
  }, [glOff]);

  const build = useCallback((_width: number, height: number): InkSpec => {
    const u = height / MARK_USER_SIZE.height;
    const cell = height / BOX.height;
    const { tInk, strength, morph } = live.current;
    const base = markParams(u);
    return {
      // 余量不跟着强度变：画布大小固定，逐帧重画时只换里面的内容
      padding: markPadding(u),
      draw: (ctx) => {
        if (tInk < 0) return;
        ctx.scale(cell, cell);
        ctx.translate(-BOX.x, -BOX.y);
        if (tInk < 1 && morph) {
          ctx.fill(new Path2D(morphPath(morph, tInk)));
        } else {
          ctx.scale(CELL_PER_INK, CELL_PER_INK);
          ctx.translate(-INK_ORIGIN.x, -INK_ORIGIN.y);
          ctx.fill(new Path2D(MARK_PATH), "evenodd");
        }
      },
      params: {
        ...base,
        tight: base.tight * strength,
        loose: base.loose * strength,
        displacement: base.displacement * strength,
        reveal: null,
        // 变形刚开始时边缘要和矢量一样利：模糊按全分辨率算（默认是一半）
        blurScale: 1,
      },
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const plate = plateRef.current;
    const stage = stageRef.current;
    const svg = stage?.querySelector("svg");
    if (!wrap || !plate || !stage || !svg) return;

    const one = <T extends Element>(name: string) => stage.querySelector<T>(`[data-m="${name}"]`);
    const all = <T extends Element>(name: string) => [...stage.querySelectorAll<T>(`[data-m="${name}"]`)];
    const guides = one<SVGGElement>("guides");
    const grid = one<SVGRectElement>("grid");
    const cross = one<SVGPathElement>("cross");
    const solid = one<SVGGElement>("solid");
    const morphEl = one<SVGPathElement>("morph");
    const inkEl = one<SVGPathElement>("ink");
    const circles = all<SVGCircleElement>("circle");
    const lines = all<SVGLineElement>("line");
    const cuts = all<SVGLineElement>("cut");
    const stroke = (name: string) => one<SVGPathElement>(name);
    const [bar, frame, stem, ml, mr, il, ir] = ["bar", "frame", "stem", "ml", "mr", "il", "ir"].map(stroke);
    if (!guides || !grid || !cross || !solid || !morphEl || !inkEl) return;

    let morph: Morph | null = null;
    try {
      morph = buildMorph(svg);
    } catch {
      morph = null;
    }
    live.current.morph = morph;

    // 画出 0–1 的一段实线（pathLength 已经归一到 total）
    const draw = (el: SVGPathElement | null, t: number, total = 100) => {
      if (!el) return;
      // 画满的时候去掉虚线：归一化的长度有一点误差，不去掉的话线尾会短一丝
      el.style.strokeDasharray = t >= 0.9995 ? "none" : `${f(t * total)} ${total * 3}`;
      el.style.visibility = t <= 0.0005 ? "hidden" : "visible";
    };

    let glKey = "";
    let finished = false;
    // 把墨的画布更新到这一刻：形状或强度变了才重画，否则墨接着自己流、鼠标划出的口子也留着
    const ink = (tInk: number, strength: number) => {
      const key = tInk < 0 ? "off" : `${tInk.toFixed(4)}/${strength.toFixed(4)}`;
      if (key === glKey) return;
      glKey = key;
      live.current.tInk = tInk;
      live.current.strength = strength;
      relayout.current?.();
    };

    // 一帧：p 是 0–1 的总进度。
    //   方格 0–0.06 · 圆 0.03–0.35 · 直线 0.24–0.42 · 笔画 0.36–0.67 · 四刀 0.62–0.80 · 收辅助线 0.74–0.88 · 变形和化开 0.82–1.16
    const render = (p: number) => {
      const q = p * END;

      const clear = sine(seg(q, 0.74, 0.88));
      grid.style.opacity = String(sine(seg(q, 0, 0.06)));
      cross.style.opacity = String(sine(seg(q, 0.01, 0.06)) * (1 - clear));
      guides.style.opacity = String(1 - clear);

      // 六个圆，从里到外，像雨点落水的涟漪
      circles.forEach((el, i) => {
        const t = seg(q, 0.03 + i * 0.03, 0.2 + i * 0.03);
        el.setAttribute("r", f(RADII[i] * outQuint(t)));
        el.style.opacity = String(out(seg(t, 0, 0.35)));
      });

      lines.forEach((el, i) => {
        const t = sine(seg(q, 0.24 + (i >> 1) * 0.02, 0.36 + (i >> 1) * 0.02));
        const [x1, y1, x2, y2] = LINES[i];
        el.setAttribute("x2", f(x1 + (x2 - x1) * t));
        el.setAttribute("y2", f(y1 + (y2 - y1) * t));
        el.style.visibility = t <= 0.0005 ? "hidden" : "visible";
      });

      // 按笔顺填：一横 → 外框 → 一竖 → 四点
      draw(bar, sine(seg(q, 0.36, 0.47)));
      draw(frame, sine(seg(q, 0.4, 0.57)));
      draw(stem, sine(seg(q, 0.49, 0.61)));
      // 四刀：红线从圆心射出去，弧从竖直方向退到切口
      const mid = sine(seg(q, 0.54, 0.65)) * 90 - sine(seg(q, 0.7, 0.8)) * CUT_MID_DEG;
      const inner = sine(seg(q, 0.56, 0.67)) * 90 - sine(seg(q, 0.68, 0.78)) * CUT_IN_DEG;
      draw(ml, mid / 90, 90);
      draw(mr, mid / 90, 90);
      draw(il, inner / 90, 90);
      draw(ir, inner / 90, 90);
      const cutFade = 1 - sine(seg(q, 0.76, 0.86));
      cuts.forEach((el, i) => {
        const late = i > 1 ? 0.02 : 0;
        const t = out(seg(q, 0.62 + late, 0.7 + late));
        el.setAttribute("x2", f(C.x + (CUT_ENDS[i][0] - C.x) * t));
        el.setAttribute("y2", f(C.y + (CUT_ENDS[i][1] - C.y) * t));
        el.style.visibility = t <= 0.0005 ? "hidden" : "visible";
        el.style.opacity = String(cutFade);
      });

      // 几何版变成墨迹版，墨在变形的同时往外渗（形状先到，渗开收尾）
      const both = seg(q, MORPH_FROM, END);
      const started = both > 0;
      const tInk = inOut(seg(both, 0, 0.85));
      const off = glOffRef.current;
      solid.style.display = started ? "none" : "";
      // 没有 WebGL：变形在 SVG 里做完，停在墨迹版（画完以后外面换成静态的化开）
      const inSvg = started && off;
      morphEl.style.display = inSvg && tInk < 1 && morph ? "" : "none";
      if (inSvg && tInk < 1 && morph) morphEl.setAttribute("d", morphPath(morph, tInk));
      inkEl.style.display = inSvg && (tInk >= 1 || !morph) && !finished ? "" : "none";
      ink(started && !off ? tInk : -1, smooth(both));

      const now = p >= 0.999;
      if (now !== finished) {
        finished = now;
        setDone(now);
      }
    };

    // 减少动态效果：直接是画完的样子，不跟滚动
    if (reducedMotion) {
      render(1);
      return;
    }

    // 钉住的位置（CSS 里的 top）在尺寸变化时才重新读
    let stickyTop = 0;
    const measure = () => {
      stickyTop = parseFloat(getComputedStyle(plate).top) || 0;
    };
    measure();
    window.addEventListener("resize", measure);

    const progress = () => {
      const travel = wrap.offsetHeight - plate.offsetHeight;
      if (travel <= 0) return 1;
      return clamp((stickyTop - wrap.getBoundingClientRect().top) / travel / TRAVEL_USED);
    };

    // 第一帧直接落在当前位置：刷新或返回时人可能已经在这一章中间，不要从头追一遍
    let shown = progress();
    render(shown);
    const tick = (_time: number, deltaTime: number) => {
      const target = progress();
      const k = 1 - Math.pow(SMOOTH, (Math.min(64, deltaTime) / 16.7) * 0.35);
      shown += (target - shown) * k;
      if (Math.abs(target - shown) < 0.0004) shown = target;
      render(shown);
    };

    // 只在这一块靠近视口时才每帧算
    let ticking = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === ticking) return;
        ticking = entry.isIntersecting;
        if (ticking) gsap.ticker.add(tick);
        else gsap.ticker.remove(tick);
      },
      { rootMargin: "200px" },
    );
    observer.observe(wrap);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
    };
  }, [reducedMotion]);

  const viewBox = `${f(BOX.x)} ${f(BOX.y)} ${f(BOX.width)} ${f(BOX.height)}`;

  return (
    // --mh：标志的高度（化开的标志最小 240 px，手册 02）；--ph：整块图版的高度，上下各留出晕和最外那个圆探出去的地方
    <div
      ref={wrapRef}
      className={cn(
        "[--mh:min(22rem,60vw)] [--ph:calc(var(--mh)_+_15rem)]",
        !reducedMotion && "h-[calc(var(--ph)_+_var(--travel))]",
      )}
      style={{ "--travel": `${TRAVEL_SCREENS * 100}svh` } as CSSProperties}
    >
      <figure
        ref={plateRef}
        className="sticky top-[max(4.5rem,calc((100svh_-_var(--ph))_/_2))] flex h-[var(--ph)] min-w-0 flex-col gap-3"
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center bg-design-dark-surface text-design-dark-text-primary">
          {/* 三层，从下到上：辅助线和实心笔画（SVG）→ 墨的画布 → 切口的红线（SVG）。
              红线要一直压在笔画上面，不管笔画此刻是矢量还是已经交给了墨 */}
          <div ref={stageRef} role="img" aria-label={label} className="relative aspect-[34.865/35.099] h-[var(--mh)]">
            {/* viewBox 就是墨迹的外框（按格算）：方格、圆和墨的画布用同一套坐标。最外的圆和方格会画到框外面 */}
            <svg viewBox={viewBox} aria-hidden="true" className={LAYER} fill="none">
              {/* 辅助线：方格、六个圆、几条直线。点线 */}
              <g
                data-m="guides"
                className={cn("stroke-design-dark-text-muted", HAIRLINES)}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeDasharray="0.01 5"
                style={{ opacity: 0 }}
              >
                <rect data-m="grid" width={22} height={22} />
                {RADII.map((r) => (
                  <circle key={r} data-m="circle" cx={C.x} cy={C.y} r={r} />
                ))}
                {LINES.map(([x1, y1, x2, y2]) => (
                  <line key={`${x1}-${y1}-${x2}`} data-m="line" x1={x1} y1={y1} x2={x2} y2={y2} />
                ))}
              </g>

              {/* 实心的笔画：全是 2 格粗的线，中线落在方格上，画出来和几何版一模一样。
                  脚本接手之前先是画好的几何版 */}
              <g data-m="solid" stroke="currentColor" strokeWidth={2}>
                <path data-m="bar" d="M3 1H19" pathLength={100} />
                <path data-m="frame" d="M1 22V14A10 10 0 0 1 21 14V22" pathLength={100} />
                <path data-m="stem" d="M11 0V22" pathLength={100} />
                {/* 四段弧：pathLength 取 90，虚线长度就是它张开的角度 */}
                <path data-m="ml" d="M4 14A7 7 0 0 1 11 7" pathLength={90} strokeDasharray={`${90 - CUT_MID_DEG} 270`} />
                <path data-m="mr" d="M18 14A7 7 0 0 0 11 7" pathLength={90} strokeDasharray={`${90 - CUT_MID_DEG} 270`} />
                <path data-m="il" d="M7 14A4 4 0 0 1 11 10" pathLength={90} strokeDasharray={`${90 - CUT_IN_DEG} 270`} />
                <path data-m="ir" d="M15 14A4 4 0 0 0 11 10" pathLength={90} strokeDasharray={`${90 - CUT_IN_DEG} 270`} />
              </g>

              {/* 只在没有 WebGL 时用：变形的中间形状，和变完的墨迹版 */}
              <path data-m="morph" fill="currentColor" style={{ display: "none" }} />
              <path
                data-m="ink"
                d={MARK_PATH}
                fillRule="evenodd"
                fill="currentColor"
                transform={INK_TO_GRID}
                style={{ display: "none" }}
              />
            </svg>

            <InkSurface
              className="absolute inset-0"
              tables={INK_TABLES}
              build={build}
              buildKey="mark-motion"
              onRelayout={onRelayout}
              onUnavailableChange={setGlLost}
              fallback={done ? <InkMarkSvg viewBox={MARK_INK_BOX} bleed className="h-full w-full" /> : null}
            />

            {/* 圆心和四刀 */}
            <svg viewBox={viewBox} aria-hidden="true" className={cn(LAYER, "stroke-accent", HAIRLINES)} fill="none" strokeWidth={1.25}>
              <path data-m="cross" d="M10.4 14H11.6M11 13.4V14.6" style={{ opacity: 0 }} />
              {CUT_ENDS.map(([x, y]) => (
                <line key={`${x}-${y}`} data-m="cut" x1={C.x} y1={C.y} x2={x} y2={y} style={{ visibility: "hidden" }} />
              ))}
            </svg>
          </div>
          {/* 画完才出现；触屏没有悬停，不显示（手指滑过照样能划开）。减少动态效果时墨是静止的，也不显示 */}
          <p
            aria-hidden={!done}
            className={cn(
              "absolute inset-x-0 bottom-5 hidden text-center font-mono text-small text-design-dark-text-muted transition-opacity duration-slow [@media(hover:hover)]:block",
              done && !reducedMotion && !glOff ? "opacity-100" : "opacity-0",
            )}
          >
            {hint}
          </p>
        </div>
        <figcaption className="font-mono text-small text-design-dark-text-muted">{caption}</figcaption>
      </figure>
    </div>
  );
}
