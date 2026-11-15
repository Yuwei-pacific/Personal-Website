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
export function poolPath(rect: Rect, seed: number): Path2D {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const hw = rect.width / 2 + POOL_PAD;
  const hh = rect.height / 2 + POOL_PAD;
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
export const poolBounds = (rect: Rect): Rect => ({
  x: rect.x - POOL_PAD,
  y: rect.y - POOL_PAD,
  width: rect.width + POOL_PAD * 2,
  height: rect.height + POOL_PAD * 2,
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
 * mobile：单列时文字在墨滩下方、占满宽度，线不能从中间穿过文字 —— 改走左侧页边距，
 * 竖着往下流，只轻轻摆一点，经过墨滩时从墨滩左缘里穿过。
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

function mobileThread(width: number, covers: Rect[], ruleY: number): Sample[] {
  // 左侧页边距的正中：手机上封面占位比文字再收进 1rem（见 featured-work.tsx），
  // 所以文字左缘 = 占位左缘 − 16，线走在屏幕边缘与文字左缘的中间，不碰字
  const textLeft = covers.length ? covers[0].x - 16 : 24;
  const gutter = Math.max(6, textLeft / 2);
  const start: Sample = { x: gutter, y: START_Y, f: START_WEIGHT };
  const out: Sample[] = [start];
  let last: Point = start;
  covers.forEach((rect, i) => {
    // 进出点一左一右差几 px，竖线带一点手写的摆动
    const entry = { x: gutter + 5, y: rect.y + rect.height * 0.1 };
    const exit = { x: gutter - 3, y: rect.y + rect.height * 0.9 };
    flowDown(out, last, entry, i === 0 ? fromTip : between);
    sampleCubic(out, entry, entry, exit, exit, () => 1);
    last = exit;
  });
  // 落到目录顶线：沿页边距往下，到线的高度再拐向右
  const land = { x: gutter + 48, y: ruleY };
  const dy = Math.max(60, ruleY - last.y);
  sampleCubic(out, last, { x: gutter, y: last.y + dy * 0.8 }, { x: gutter, y: ruleY }, land, (t) => 1 - 0.6 * t);
  sampleCubic(out, land, { x: width * 0.5, y: ruleY }, { x: width * 0.8, y: ruleY }, { x: width + 200, y: ruleY }, () => 0.4);
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
  const w = ABOUT_WEIGHT;
  const size = word.height / 1.1;
  const baseY = word.y + word.height + 1;
  // 比词大一圈的扁圆（超椭圆，接近药丸形）
  const rx = word.width / 2 + size * 0.1;
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
    const grow = 1 + 0.035 * k + 0.012 * Math.sin(phi * 2 + 0.8);
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

/** 墨线的晕带（画进模糊源图） */
export function strokeBand(ctx: CanvasRenderingContext2D, samples: Sample[]) {
  strokeProfile(ctx, samples, BAND, (d) => PEAK * Math.pow(1 - d, FALLOFF));
}

/** 墨线的墨芯与外裹的一圈渐变（画进 core 层，不参与化开，保证那一丝墨始终在） */
export function strokeCore(ctx: CanvasRenderingContext2D, samples: Sample[]) {
  strokeProfile(ctx, samples, HALO, (d) => 1 - (HALO_INNER + (1 - HALO_INNER) * Math.pow(d, 0.8)));
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    ctx.lineWidth = CORE * (0.5 + 0.5 * b.f);
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
