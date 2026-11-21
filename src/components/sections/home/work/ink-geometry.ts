// 首页 Work 区的墨：墨滩（封面显在里面）与串起它们的墨线。全是纯函数，只往 2D 画布上画形状，
// 由 work-ink.tsx 交给 InkSurface 去化开（见 ui/ink/ink-gl.ts）。
//
// 墨线的规矩来自样稿迭代（用户看过并否决过的样子写在设计文档的「反目标」里）：
// - 往下流淌：每段竖直流出、竖直流进，是 S 形，不在留白里斜拉直线（像电缆）；
// - 有轻重：靠近墨滩粗、晕宽，和墨滩融在一起；两滩之间收细（像提笔），不是一路等宽（像霓虹灯管）；
// - 从墨滩靠来路、去路的一侧流进流出，不从正中间扎进去。
import { THREAD_X } from "@/components/ui/ink/ink-tables";

/** 尺度：每「用户单位」多少 CSS px，与首屏标志一致（晕看起来是同一滴墨） */
export const U = 2.6;
/** 墨滩比封面占位外扩多少（墨在边缘化开时会往里收，留够了图像才差不多是占位的大小） */
export const POOL_PAD = 32;
/** 手机上的外扩量：屏幕窄，外扩 32 的墨滩两边会被屏幕边缘切平，晕也露不出来 */
export const POOL_PAD_MOBILE = 20;

// 墨线的截面：晕带半高、中心墨量与淡出曲线；墨芯外裹的一圈渐变（贴着墨芯处 ≈ Cobalt）；墨芯粗细
const BAND = 20 * U;
const PEAK = 0.68;
const FALLOFF = 1.4;
const HALO = 7 * U;
const HALO_INNER = 0.34;
const CORE = 4;

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
/** 墨线上的一个采样点；f 是这里的粗细系数（0–1） */
export type Sample = Point & { f: number };

/** 作品区的化开参数：比首屏收一档 —— 主角是封面，彩边只贴着墨滩一圈，不往外冲 */
export const WORK_INK = {
  tight: 3 * U,
  loose: 10 * U,
  displacement: 4 * U,
  warpFrequency: 0.011 / U,
  weightFrequency: 0.005 / U,
  spreadBias: 0,
} as const;


// 可复现的「噪声」：几个正弦叠加，每滩墨的相位不同（同一个项目每次画出来一样）
function wobble(seed: number) {
  const phases = [1.7, 4.1, 2.9, 5.3].map((k) => (seed * 12.9898 * k) % (Math.PI * 2));
  return (a: number) =>
    Math.sin(a * 2 + phases[0]) * 0.5 +
    Math.sin(a * 3 + phases[1]) * 0.3 +
    Math.sin(a * 5 + phases[2]) * 0.15 +
    Math.sin(a * 7 + phases[3]) * 0.08;
}

/** 一滩墨的轮廓：围绕封面占位外扩 POOL_PAD 的超椭圆（介于圆角矩形与椭圆之间），边缘按噪声起伏 */
export function poolPath(rect: Rect, seed: number, pad = POOL_PAD): Path2D {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const hw = rect.width / 2 + pad;
  const hh = rect.height / 2 + pad;
  const noise = wobble(seed + 1);
  const path = new Path2D();
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 0.32) * hw;
    const y = Math.sign(s) * Math.pow(Math.abs(s), 0.32) * hh;
    const r = 1 + noise(a) * 0.07;
    if (i === 0) path.moveTo(cx + x * r, cy + y * r);
    else path.lineTo(cx + x * r, cy + y * r);
  }
  path.closePath();
  return path;
}

/**
 * 墨滩所占的外接矩形（封面占位外扩 POOL_PAD）：图像、视频按它铺满，再裁成墨滩形状。
 * 代价是封面四边各被墨边吃掉约 POOL_PAD。试过让图像只铺到占位那么大（封面完整）：墨滩边缘起伏
 * 到图像外面的地方会露出图像的直边，变成「黑框里一张方图」，不像作品在墨里 —— 所以保留铺满。
 * 封面上贴边的内容（导航栏、角标）会被裁，选封面或在 Studio 里标焦点时留出边距
 */
export const poolBounds = (rect: Rect, pad = POOL_PAD): Rect => ({
  x: rect.x - pad,
  y: rect.y - pad,
  width: rect.width + pad * 2,
  height: rect.height + pad * 2,
});

function cubicAt(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const m = 1 - t;
  return {
    x: m * m * m * a.x + 3 * m * m * t * b.x + 3 * m * t * t * c.x + t * t * t * d.x,
    y: m * m * m * a.y + 3 * m * m * t * b.y + 3 * m * t * t * c.y + t * t * t * d.y,
  };
}

// 一段三次曲线，按约 6px 一个点采样
function sampleCubic(out: Sample[], a: Point, b: Point, c: Point, d: Point, weight: (t: number) => number) {
  const length = Math.hypot(b.x - a.x, b.y - a.y) + Math.hypot(c.x - b.x, c.y - b.y) + Math.hypot(d.x - c.x, d.y - c.y);
  const n = Math.max(8, Math.ceil(length / 6));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    out.push({ ...cubicAt(a, b, c, d, t), f: weight(t) });
  }
}

// 两点之间往下流：起点竖直向下出发，终点竖直向下到达
function flowDown(out: Sample[], from: Point, to: Point, weight: (t: number) => number) {
  const dy = Math.max(40, to.y - from.y);
  sampleCubic(out, from, { x: from.x, y: from.y + dy * 0.55 }, { x: to.x, y: to.y - dy * 0.55 }, to, weight);
}

// 起笔的位置（离作品区上缘多远）与笔尖的粗细；从笔尖到第一滩墨，越走越重
const START_Y = 24;
const START_WEIGHT = 0.08;
const fromTip = (t: number) => START_WEIGHT + (1 - START_WEIGHT) * Math.pow(t, 1.3);

// 两滩墨之间：两端粗，中段收到 0.35
const between = (t: number) => 1 - 0.65 * Math.pow(Math.sin(Math.PI * t), 1.3);

/**
 * 墨线：在作品区顶部起笔，依次流过每滩墨，最后落成目录顶上的那道线、横穿出右缘。
 * covers 是封面占位（不含 POOL_PAD），按从上到下的顺序；ruleY 是目录顶线的位置。
 * mobile：单列时文字在墨滩下方，线不能从字上穿过 —— 改走文字旁边的页边距，左右交替（见 mobileThread）。
 */
export function threadSamples(width: number, covers: Rect[], ruleY: number, mobile: boolean): Sample[] {
  return mobile ? mobileThread(width, covers, ruleY) : desktopThread(width, covers, ruleY);
}


function desktopThread(width: number, covers: Rect[], ruleY: number): Sample[] {
  // 起笔：线在作品区里面自己开始，不从上缘伸进来 —— 首屏、About、Work 是同一张纸，
  // 从区块上缘冒出来的线像是被纸边切断的。笔尖落下时很细，往下越走越重
  const start: Sample = { x: width * THREAD_X, y: START_Y, f: START_WEIGHT };
  const out: Sample[] = [start];
  let last: Point = start;
  covers.forEach((rect, i) => {
    const center = rect.x + rect.width / 2;
    const nextX = i + 1 < covers.length ? covers[i + 1].x + covers[i + 1].width / 2 : width * 0.42;
    // 从靠来路的一侧流进、靠去路的一侧流出，不从正中间扎进去
    const entry = { x: rect.x + rect.width * (last.x > center ? 0.8 : 0.2), y: rect.y + rect.height * 0.1 };
    const exit = { x: rect.x + rect.width * (nextX > center ? 0.8 : 0.2), y: rect.y + rect.height * 0.9 };
    flowDown(out, last, entry, i === 0 ? fromTip : between);
    // 墨滩里面：被封面盖住，只是让线在墨里连上
    sampleCubic(out, entry, entry, exit, exit, () => 1);
    last = exit;
  });
  // 最后一段：往下流，再缓缓转成目录顶上的横线，越来越细
  const land = { x: width * 0.42, y: ruleY };
  const dy = Math.max(60, ruleY - last.y);
  sampleCubic(out, last, { x: last.x, y: last.y + dy * 0.7 }, { x: land.x - dy * 0.6, y: ruleY }, land, (t) => 1 - 0.6 * t);
  sampleCubic(out, land, { x: width * 0.6, y: ruleY }, { x: width * 0.8, y: ruleY }, { x: width + 200, y: ruleY }, () => 0.4);
  return out;
}

// 手机上墨线走的页边距：离屏幕边缘多远；经过文字旁边时的粗细；出了墨滩往下多远之内要让到页边距里
// （墨滩下面先是编号和标题，都短，右边空着；再往下是占满行宽的简介）
const GUTTER = 20;
const GUTTER_WEIGHT = 0.5;
const TEXT_CLEAR = 120;

/**
 * 手机（单列）的墨线。文字在墨滩下方，线不能从字上穿过，所以走文字旁边的页边距 —— 但不是贴着屏幕左缘
 * 一竖到底（那样像一道粗黑边框，用户 2026-11-16 说丑）：
 * - 左右交替：第 1 个作品之后走右边，第 2 个之后走左边……和桌面上封面左右交错是同一个节奏。
 *   featured-work.tsx 里文字块按同样的奇偶在那一侧让出 3rem。
 * - 换边发生在墨滩里面（被封面盖住），露在外面的每一段都是一道括号形的弧：从墨滩底边靠外的地方出来，
 *   让到页边距，再弯回去流进下一滩。
 * - 经过文字旁边时收细（提笔），靠近墨滩才重。
 * - 起笔在右上，和桌面一样从标题右边落下来；最后顺着所在的一侧转成目录顶线，横着出另一侧的屏幕边缘。
 */
function mobileThread(width: number, covers: Rect[], ruleY: number): Sample[] {
  // 起笔比第一滩墨的入口靠左一些：落下来是一道弧，不是一根竖直的棍子
  const start: Sample = { x: width * 0.7, y: START_Y, f: START_WEIGHT };
  const out: Sample[] = [start];
  if (!covers.length) return out;
  const side = (rect: Rect, right: boolean) => rect.x + rect.width * (right ? 0.88 : 0.12);
  const first = { x: side(covers[0], true), y: covers[0].y + covers[0].height * 0.1 };
  flowDown(out, start, first, fromTip);
  let entry: Point = first;
  covers.forEach((rect, i) => {
    const right = i % 2 === 0;
    const dir = right ? -1 : 1;
    const gx = right ? width - GUTTER : GUTTER;
    // 墨滩里面：被封面盖住，线在这里换边
    const exit = { x: side(rect, right), y: rect.y + rect.height * 0.9 };
    sampleCubic(out, entry, entry, exit, exit, () => 1);
    // 出墨滩，让到页边距里，越走越细
    const top = { x: gx, y: rect.y + rect.height + TEXT_CLEAR };
    flowDown(out, exit, top, (t) => 1 - (1 - GUTTER_WEIGHT) * Math.pow(t, 0.55));
    const next = covers[i + 1];
    if (next) {
      // 沿着文字往下，带一点手写的摆动，再弯回去流进下一滩
      const bottom = { x: gx + dir * 4, y: Math.max(top.y + 20, next.y - 70) };
      const span = bottom.y - top.y;
      sampleCubic(
        out,
        top,
        { x: gx - dir * 6, y: top.y + span * 0.35 },
        { x: gx + dir * 2, y: top.y + span * 0.7 },
        bottom,
        () => GUTTER_WEIGHT,
      );
      entry = { x: side(next, right), y: next.y + next.height * 0.1 };
      flowDown(out, bottom, entry, (t) => GUTTER_WEIGHT + (1 - GUTTER_WEIGHT) * t);
      return;
    }
    // 最后一段：沿页边距往下，在目录顶线的高度缓缓转成横线，从另一侧出屏幕
    const before = { x: gx, y: Math.max(top.y + 20, ruleY - 110) };
    sampleCubic(out, top, top, before, before, () => GUTTER_WEIGHT);
    const turned = { x: gx + dir * 110, y: ruleY };
    sampleCubic(out, before, { x: gx, y: ruleY - 30 }, { x: gx + dir * 40, y: ruleY }, turned, (t) => GUTTER_WEIGHT + 0.12 * t);
    const off = right ? -200 : width + 200;
    sampleCubic(out, turned, { x: turned.x + dir * 60, y: ruleY }, { x: off - dir * 60, y: ruleY }, { x: off, y: ruleY }, () => 0.4);
  });
  return out;
}

// 过一串关键点的顺滑曲线（Hermite，切线按弦长归一）：关键点疏密不均时也不会甩出去。约 5px 一个采样点
function sampleSpline(points: Sample[]): Sample[] {
  const n = points.length;
  if (n < 2) return points;
  const lengths = points.slice(1).map((p, i) => Math.max(0.001, Math.hypot(p.x - points[i].x, p.y - points[i].y)));
  const direction = (i: number): Point => ({
    x: (points[i + 1].x - points[i].x) / lengths[i],
    y: (points[i + 1].y - points[i].y) / lengths[i],
  });
  const tangents = points.map((_, i) => {
    const before = direction(Math.max(0, i - 1));
    const after = direction(Math.min(n - 2, i));
    return { x: (before.x + after.x) / 2, y: (before.y + after.y) / 2 };
  });
  const out: Sample[] = [points[0]];
  for (let i = 0; i < n - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const length = lengths[i];
    const steps = Math.max(2, Math.ceil(length / 5));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const h00 = 2 * t * t * t - 3 * t * t + 1;
      const h10 = t * t * t - 2 * t * t + t;
      const h01 = -2 * t * t * t + 3 * t * t;
      const h11 = t * t * t - t * t;
      out.push({
        x: h00 * a.x + h10 * length * tangents[i].x + h01 * b.x + h11 * length * tangents[i + 1].x,
        y: h00 * a.y + h10 * length * tangents[i].y + h01 * b.y + h11 * length * tangents[i + 1].y,
        f: a.f + (b.f - a.f) * t,
      });
    }
  }
  return out;
}

// About 那个圈的粗细：比 Work 的线轻，是手写的一道
const ABOUT_WEIGHT = 0.7;

/**
 * About 标题里手画的一个圈：把一个词圈起来，合上之后顺势带出一小撇。首页 About 只有这一处墨。
 * 试过的更长的版本都被用户否了：绕过人像流进 Work 的长线（乱）、从页面左缘进来的整道下划线
 * （像草稿纸，而且和首屏那根横线撞）。所以只留圈 —— 它只做一件事：把「我设计」这个词亲手圈出来。
 * word：要圈的词的范围（坐标相对区块左上角）；lastLine：词是否在标题最后一行 ——
 * 下面还有一行字时，那一撇保持水平，不往下压到字上
 */
export function aboutCircle(word: Rect | null, lastLine: boolean): Sample[] {
  if (!word) return [];
  const size = word.height / 1.1;
  const w = ABOUT_WEIGHT;
  const baseY = word.y + word.height + 1;
  // 比词大一圈的扁圆（超椭圆，接近药丸形）
  // 左右只多出不到半个词距：圈要从词与词之间的空里穿过去，再宽就压到旁边的字（之前压到了前面的「I」）
  const rx = word.width / 2 + size * 0.075;
  const ry = (baseY - (word.y - size * 0.2)) / 2;
  const cx = word.x + word.width / 2;
  const cy = baseY - ry;
  const bend = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.6);
  const points: Sample[] = [];
  // 从底边偏左起，逆着走：底 → 右 → 顶 → 左 → 回到底边。
  // 一圈下来略微放大、带一点起伏，所以不会严丝合缝地闭上 —— 手写的圈本来就合不上
  const from = -0.3;
  const to = Math.PI * 2 + 0.3;
  const steps = 36;
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const phi = from + (to - from) * k;
    const grow = 1 + 0.02 * k + 0.012 * Math.sin(phi * 2 + 0.8);
    points.push({
      x: cx + bend(Math.sin(phi)) * rx * grow,
      y: cy + bend(Math.cos(phi)) * ry * grow,
      // 落笔轻，几步之内压实
      f: w * (0.92 + 0.08 * Math.cos(phi)) * Math.min(1, 0.3 + k * 9),
    });
  }
  // 带出的一小撇：往右，很快收细。不成线，只是笔离开纸的那一下
  const drop = lastLine ? size * 0.2 : 0;
  points.push({ x: cx + rx * 1.12, y: baseY + 2 + drop * 0.25, f: w * 0.75 });
  points.push({ x: cx + rx + size * (lastLine ? 1.1 : 0.8), y: baseY + 2 + drop, f: 0.04 });
  return sampleSpline(points);
}

// 沿采样点画一条横截面渐变、粗细可变的带：每一遍从宽而淡画到窄而浓，叠出 ink(d) 的截面
function strokeProfile(ctx: CanvasRenderingContext2D, samples: Sample[], half: number, ink: (d: number) => number) {
  const passes = 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let k = 0; k < passes; k++) {
    const d = 1 - k / passes; // 这一笔的半宽占比
    const gray = Math.round(255 * (1 - ink(d)));
    ctx.strokeStyle = `rgb(${gray},${gray},${gray})`;
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      ctx.lineWidth = Math.max(1, half * 2 * d * b.f);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

/** 手机上墨线的粗细比例：同样的像素粗细放在窄屏上重得像边框，按屏幕尺度收细。这一个管晕带（彩色漫开的宽度） */
export const STROKE_SCALE_MOBILE = 0.62;
/**
 * 手机上墨芯（看得见的那一丝墨）的比例，比晕带放得宽：墨芯也按 0.62 收时，文字旁边那一段只剩不到 2px，
 * 用户说过于细（2026-11-21）。现在那一段约 2.5px，靠近墨滩约 3.4px；晕带不跟着变宽，颜色不会更抢
 */
export const CORE_SCALE_MOBILE = 0.85;

/** 墨线的晕带（画进模糊源图）。scale：整体粗细比例（窄屏、小字旁边用小于 1 的值） */
export function strokeBand(ctx: CanvasRenderingContext2D, samples: Sample[], scale = 1) {
  strokeProfile(ctx, samples, BAND * scale, (d) => PEAK * Math.pow(1 - d, FALLOFF));
}

/** 墨线的墨芯与外裹的一圈渐变（画进 core 层，不参与化开，保证那一丝墨始终在） */
export function strokeCore(ctx: CanvasRenderingContext2D, samples: Sample[], scale = 1) {
  strokeProfile(ctx, samples, HALO * scale, (d) => 1 - (HALO_INNER + (1 - HALO_INNER) * Math.pow(d, 0.8)));
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    ctx.lineWidth = Math.max(1.9, CORE * scale * (0.5 + 0.5 * b.f));
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

/** 图像按 object-fit: cover 画进矩形（natural = 图像或视频首帧的原始尺寸） */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  natural: { width: number; height: number },
  rect: Rect,
) {
  if (!natural.width || !natural.height) return;
  const scale = Math.max(rect.width / natural.width, rect.height / natural.height);
  const w = natural.width * scale;
  const h = natural.height * scale;
  ctx.drawImage(source, rect.x + (rect.width - w) / 2, rect.y + (rect.height - h) / 2, w, h);
}
