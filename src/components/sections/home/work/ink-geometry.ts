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

/**
 * About 的墨线和 Work 的墨线是两块画布上的同一笔，两块都要带上这组参数，交接处才看不出接缝：
 * - pinEdges：边缘起伏在画布上下缘收为零（两块画布的噪声不同，不钉住线会左右错开）；
 * - maxDpr：同一个像素密度，线的粗细才一样（Work 画布有好几屏高，本来就要收到 1.5 省显存）
 */
export const THREAD_SEAM = { pinEdges: 160, maxDpr: 1.5 } as const;

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

// 两滩墨之间：两端粗，中段收到 0.35
const between = (t: number) => 1 - 0.65 * Math.pow(Math.sin(Math.PI * t), 1.3);

/**
 * 墨线：从作品区顶部流进来，依次流过每滩墨，最后落成目录顶上的那道线、横穿出右缘。
 * covers 是封面占位（不含 POOL_PAD），按从上到下的顺序；ruleY 是目录顶线的位置。
 * mobile：单列时文字在墨滩下方、占满宽度，线不能从中间穿过文字 —— 改走左侧页边距，
 * 竖着往下流，只轻轻摆一点，经过墨滩时从墨滩左缘里穿过。
 */
export function threadSamples(width: number, covers: Rect[], ruleY: number, mobile: boolean): Sample[] {
  return mobile ? mobileThread(width, covers, ruleY) : desktopThread(width, covers, ruleY);
}


function desktopThread(width: number, covers: Rect[], ruleY: number): Sample[] {
  // 先竖直落到区块上缘、正好在 THREAD_X：接住 About 那一段（它在下缘也正好落在这里）
  const start: Sample = { x: width * THREAD_X, y: -80, f: 0.5 };
  const out: Sample[] = [start];
  const top = { x: start.x, y: 0 };
  sampleCubic(out, start, start, top, top, () => 0.5);
  let last: Point = top;
  covers.forEach((rect, i) => {
    const center = rect.x + rect.width / 2;
    const nextX = i + 1 < covers.length ? covers[i + 1].x + covers[i + 1].width / 2 : width * 0.42;
    // 从靠来路的一侧流进、靠去路的一侧流出，不从正中间扎进去
    const entry = { x: rect.x + rect.width * (last.x > center ? 0.8 : 0.2), y: rect.y + rect.height * 0.1 };
    const exit = { x: rect.x + rect.width * (nextX > center ? 0.8 : 0.2), y: rect.y + rect.height * 0.9 };
    flowDown(out, last, entry, i === 0 ? (t) => 0.5 + 0.5 * Math.pow(t, 1.5) : between);
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
  const start: Sample = { x: gutter, y: -80, f: 0.5 };
  const out: Sample[] = [start];
  let last: Point = start;
  covers.forEach((rect, i) => {
    // 进出点一左一右差几 px，竖线带一点手写的摆动
    const entry = { x: gutter + 5, y: rect.y + rect.height * 0.1 };
    const exit = { x: gutter - 3, y: rect.y + rect.height * 0.9 };
    flowDown(out, last, entry, i === 0 ? (t) => 0.5 + 0.5 * Math.pow(t, 1.5) : between);
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

/**
 * About 里的那一段墨线（用户在 Figma 定稿的走法，画板「Home — 提案 v1」）：
 * 从页面左缘外进来 → 在标题下面走成一道手写下划线，到标题右端外一点 → 往上绕过人像的头顶和右肩 →
 * 从图注（所在地那两行小字）的外侧下来 → 在区块下缘正好落在 (width × THREAD_X, height)、竖直向下，
 * Work 的墨线从同一点竖直接着往下流，两段是一笔。
 * title：标题文字实际占的范围；portrait：人像那一方块（不随视差浮动的占位 —— 视差在人像居中时恰好为 0，
 * 所以人像在屏幕中间时，线正好贴着头顶绕过去）。坐标都相对区块左上角
 */
export function aboutThread(width: number, height: number, title: Rect | null, portrait: Rect | null): Sample[] {
  const x = width * THREAD_X;
  const quiet = () => 0.5;
  const edge = { x, y: height };
  const out: Sample[] = [];
  if (!title) {
    // 量不到标题时：从顶上直接流到交接点
    out.push({ x, y: -80, f: 0.5 });
    flowDown(out, { x, y: -80 }, edge, quiet);
  } else {
    const T = title.y + title.height + 8;
    const R = title.x + title.width + 24;
    const start: Sample = { x: -12, y: T + 6, f: 0.5 };
    out.push(start);
    // 手写下划线：几乎水平，轻轻起伏
    const end = { x: R, y: T + 4 };
    sampleCubic(out, start, { x: 180, y: T - 2 }, { x: R - 260, y: T + 14 }, end, quiet);
    if (portrait) {
      const p = portrait;
      const right = p.x + p.width;
      const top = { x: p.x + p.width * 0.25, y: p.y - 30 };
      const shoulder = { x: right + 18, y: p.y + 40 };
      const below = { x: right + 34, y: Math.min(height - 70, p.y + p.height + 70) };
      const near = { x: x + 2, y: height - 40 };
      sampleCubic(out, end, { x: R + 90, y: T - 2 }, { x: p.x - 30, y: p.y + 20 }, top, quiet);
      sampleCubic(out, top, { x: p.x + p.width * 0.5, y: p.y - 62 }, { x: p.x + p.width * 0.95, y: p.y - 52 }, shoulder, quiet);
      sampleCubic(out, shoulder, { x: right + 40, y: p.y + 160 }, { x: right + 40, y: below.y - 140 }, below, quiet);
      sampleCubic(out, below, { x: right + 28, y: below.y + 80 }, { x: x + 10, y: near.y - 30 }, near, quiet);
      sampleCubic(out, near, { x, y: height - 20 }, { x, y: height - 6 }, edge, quiet);
    } else {
      flowDown(out, end, edge, quiet);
    }
  }
  sampleCubic(out, edge, edge, { x, y: height + 80 }, { x, y: height + 80 }, quiet);
  return out;
}

/**
 * 页脚的墨线：从页面左缘进来，在邮箱下面走成一道略有起伏的分割线，到标志跟前往下一拐，
 * 落进标志「i」那一笔（end），停住 —— 首屏那根线的镜像，像画完之后的落款。
 * lineY 是分割线的高度；end 为 null（量不到标志）时一直画出右缘
 */
export function footerThread(width: number, lineY: number, end: Point | null): Sample[] {
  const quiet = () => 0.5;
  const start: Sample = { x: -12, y: lineY + 3, f: 0.5 };
  const out: Sample[] = [start];
  if (!end) {
    sampleCubic(out, start, { x: width * 0.3, y: lineY - 6 }, { x: width * 0.7, y: lineY + 8 }, { x: width + 200, y: lineY }, quiet);
    return out;
  }
  // 拐弯前的那一点：离标志留出一段，线才有地方缓缓弯下去
  const drop = Math.max(0, end.y - lineY);
  const turn = { x: end.x - Math.max(110, drop * 1.6), y: lineY - 1 };
  sampleCubic(out, start, { x: width * 0.22, y: lineY - 6 }, { x: turn.x - width * 0.22, y: lineY + 8 }, turn, quiet);
  // 弯进竖笔：靠近标志时略重一点，像收笔
  sampleCubic(
    out,
    turn,
    { x: turn.x + (end.x - turn.x) * 0.62, y: lineY - 5 },
    { x: end.x + drop * 0.12, y: lineY + drop * 0.3 },
    end,
    (t) => 0.5 + 0.35 * t,
  );
  return out;
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

/** 墨线的晕带（画进模糊源图）。scale：晕的宽度按比例收（页脚的标志小，线的晕也要跟着小） */
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
