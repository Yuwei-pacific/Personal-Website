// 「化开」效果的 WebGL 渲染器（品牌手册第 03、04、08 章：五色、晕、水）。
//
// 为什么不用 SVG 滤镜：滤镜链（噪声、位移、两层大半径模糊、颗粒、查找表）由浏览器在 CPU 上
// 逐像素计算，任何动画都会让它每帧重算，掉帧。这里把同一套效果搬到 GPU 上，并把昂贵的部分拆开：
//
//   尺寸变化时（一次性）：
//     形状画进一张黑白源图（墨 = 0、纸 = 1）→ 在 GPU 上做可分离高斯模糊，存成纹理：
//     tight（收得紧）、loose（渗得开）；另有一张 core —— 只画「必须保留一丝墨芯」的细形状
//     （首屏的墨线），轻微模糊，合成时取较小值，细线才不会被晕整个冲淡。
//   每帧（便宜）：
//     采样坐标先过一层缓慢流动的噪声位移（边缘起伏）→ 减去「拨动场」的位移（鼠标划过的痕迹）→
//     按低频噪声在 tight / loose 之间逐像素混合 → 叠一层随时间变化的低频噪声，让晕局部变粗变细
//     （呼吸）→ 拨开的口子里露出纸 → 颗粒 → 查找表映射成五色与透明度。
//
// 交互是「筷子划过汤里的油」：没有点击。鼠标划过时沿路径把墨往两侧推开、中间划出一道口子；
// 拨动场每帧衰减，墨慢慢流回来、重新粘成一块。划得越快口子越大。
// 输出是预乘 alpha 的透明画布：晕的最外一段淡出到透明，露出页面自己的底色。

import type { InkTables } from "./ink-tables";

// ── 着色器 ──────────────────────────────────────────────────────────────

const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// 可分离高斯模糊。taps 数固定上限 64，大半径时用步长跨着采样（线性过滤补足中间值）
const BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSource;
uniform vec2 uStep;     // 每个 tap 在 uv 上的跨度（方向 × 步长）
uniform float uSigma;   // 以 tap 计的 sigma
uniform int uRadius;    // 每侧 tap 数
void main() {
  float sum = 0.0;
  float weights = 0.0;
  for (int i = -64; i <= 64; i++) {
    if (i < -uRadius || i > uRadius) continue;
    float x = float(i);
    float w = exp(-0.5 * x * x / (uSigma * uSigma));
    sum += texture(uSource, vUv + uStep * x).r * w;
    weights += w;
  }
  outColor = vec4(sum / weights, 0.0, 0.0, 1.0);
}`;

// 拨动场：rg = 位移（编码到 0–1，0.5 为零），b = 口子的深度。
// 每帧先整体衰减（墨流回来），再沿鼠标这一帧划过的线段盖一笔：两侧往外推，中间划开
const TRAIL = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPrevious;
uniform vec2 uSize;       // 画布尺寸（CSS px）
uniform vec2 uFrom;       // 这一帧鼠标划过的线段（画布坐标，CSS px）
uniform vec2 uTo;
uniform float uStrength;  // 0–1，随划动速度
uniform float uRadius;    // 筷子的影响半径（CSS px）
uniform float uDecay;     // 位移这一帧保留多少
uniform float uCutDecay;  // 口子这一帧保留多少
uniform float uMaxShift;  // 位移编码的上限（CSS px）
void main() {
  vec4 previous = texture(uPrevious, vUv);
  vec2 shift = (previous.rg - 0.5) * 2.0 * uMaxShift * uDecay;
  float cut = previous.b * uCutDecay;
  // 场存在 8 位纹理里：每帧的衰减量小于半格时会被取整抵消，小位移就永远卡在那里、墨合不回去。
  // 所以每帧至少再往 0 走 0.6 格
  float quantum = 0.6 / 255.0;
  shift = sign(shift) * max(abs(shift) - quantum * 2.0 * uMaxShift, 0.0);
  cut = max(cut - quantum, 0.0);

  if (uStrength > 0.0) {
    // 拨动场纹理的第 0 行就是画布顶边（INK 里按同样的方向读），所以这里不翻转
    vec2 p = vUv * uSize;
    vec2 segment = uTo - uFrom;
    float h = clamp(dot(p - uFrom, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
    vec2 away = p - (uFrom + segment * h);
    float d = length(away);
    vec2 normal = d > 0.001 ? away / d : vec2(0.0);
    float r = d / uRadius;
    // 推力在离路径约 0.7 个半径处最大，路径上为 0（那里交给口子）
    shift += normal * uStrength * r * exp(-r * r) * 2.33 * uMaxShift * 0.6;
    cut = max(cut, uStrength * exp(-r * r * 4.0));
  }

  shift = clamp(shift, -uMaxShift, uMaxShift);
  outColor = vec4(shift / (2.0 * uMaxShift) + 0.5, cut, 1.0);
}`;

const INK = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTight;
uniform sampler2D uLoose;
uniform sampler2D uCore;
uniform sampler2D uTrail;
uniform sampler2D uLut;

uniform vec2 uSize;             // 画布尺寸（CSS px）
uniform float uTime;            // 秒
uniform float uFlow;            // 0 = 静止（减弱动画）
uniform float uDisplacement;    // 边缘起伏的幅度（CSS px）
uniform float uWarpFrequency;   // 起伏噪声的频率（每 CSS px）
uniform float uWeightFrequency; // 紧 / 松混合噪声的频率（每 CSS px）
uniform float uSpreadBias;      // 竖向偏置：> 0 时越往下越渗得开（标志的「上紧下松」）
uniform float uBreath;          // 呼吸改变明暗的幅度
uniform float uBreathWeight;    // 呼吸改变紧 / 松比例的幅度
uniform float uBreathPeriod;    // 一呼一吸的周期（秒）
uniform float uBreathFrequency; // 呼吸相位噪声的频率（每 CSS px）
uniform float uGrain;
uniform float uGrainFrequency;
uniform float uMaxShift;
uniform vec3 uReveal;           // xy 水落下的点，z 当前半径
uniform float uRevealOn;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 噪声坐标整体偏离原点：hash 在原点附近退化（全是 0），低频噪声的整块画布又都落在原点附近
float fbm(vec2 p) {
  p += vec2(37.13, 91.71);
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += amplitude * valueNoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return sum / 0.875;
}

void main() {
  // 画布坐标（CSS px），原点在左上；纹理也是左上为原点
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float t = uTime * uFlow;

  // 1. 墨还没干：边缘随时间缓慢起伏
  vec2 warpAt = p * uWarpFrequency;
  vec2 warp = vec2(
    fbm(warpAt + vec2(t * 0.06, -t * 0.04)),
    fbm(warpAt + vec2(17.3, 4.1) + vec2(-t * 0.05, t * 0.03))
  ) - 0.5;
  vec2 q = p + warp * 2.0 * uDisplacement;

  // 2. 筷子划过：墨被推开（位移），中间划开一道口子（cut）
  vec4 trail = texture(uTrail, p / uSize);
  q -= (trail.rg - 0.5) * 2.0 * uMaxShift;
  float cut = trail.b;

  vec2 uv = q / uSize;
  float tight = texture(uTight, uv).r;
  float loose = texture(uLoose, uv).r;
  float core = texture(uCore, uv).r;

  // 3. 紧 / 松按低频噪声逐像素混合；混合图案自己也在极慢地漂移
  //    呼吸（4）也作用在这里：吸气时往 loose 走（晕渗开），呼气时往 tight 收
  float phase = fbm(q * uBreathFrequency + vec2(t * 0.02, -t * 0.015)) * 9.42;
  float breath = sin(t * 6.2832 / uBreathPeriod + phase);
  float weightNoise = fbm(q * uWeightFrequency + vec2(t * 0.012, t * 0.008));
  float weight = clamp(
    3.5 * weightNoise - 1.23 + uSpreadBias * (p.y / uSize.y - 0.45) + breath * uBreathWeight,
    0.0, 1.0
  );
  float value = mix(tight, loose, weight);

  // 4. 呼吸：每一处按自己的相位做正弦起伏（相位取自一张低频噪声，各部位此起彼伏而不是整体齐跳），
  //    晕跟着一胀一缩、变粗变细。只靠漂移的噪声太含糊，看不出是在呼吸
  // 5. 细墨芯：只在 core 里画了形状的地方生效（首屏墨线那一丝墨），别处 core = 1 不影响
  value = min(value, core);
  value = clamp(value - breath * uBreath, 0.0, 1.0);

  // 6. 口子里露出纸
  value = mix(value, 1.0, cut * 0.9);

  // 7. 颗粒（晕）
  vec2 grainAt = p * uGrainFrequency;
  float grain = valueNoise(grainAt) + valueNoise(grainAt + vec2(31.7, 7.3)) + valueNoise(grainAt + vec2(-12.1, 51.9));
  value = clamp(value + uGrain * (grain - 1.5), 0.0, 1.0);

  // 8. 五色：rgb 按明暗值取，alpha 已经在表里按 1 − 明暗值算好
  vec4 color = texture(uLut, vec2(value, 0.5));
  float alpha = color.a;

  // 9. 显影：水从一点落下，湿的边界不规则地漫开，漫到哪里墨才显出来
  if (uRevealOn > 0.5) {
    float edge = uReveal.z + (fbm(p * 0.012) - 0.5) * 0.45 * max(uReveal.z, 1.0);
    alpha *= 1.0 - smoothstep(edge - 36.0, edge, length(p - uReveal.xy));
  }

  outColor = vec4(color.rgb * alpha, alpha);
}`;

// ── 查找表 ──────────────────────────────────────────────────────────────

// SVG feFuncX type="table" 的语义：n 个值等分 [0,1]，段内线性插值
function sampleTable(values: number[], v: number) {
  const n = values.length - 1;
  const k = Math.min(Math.floor(v * n), n - 1);
  const f = v * n - k;
  return values[k] + (values[k + 1] - values[k]) * f;
}

const LUT_SIZE = 256;

function buildLut(tables: InkTables) {
  const [r, g, b, a] = tables.map((t) => t.split(/\s+/).map(Number));
  const data = new Uint8Array(LUT_SIZE * 4);
  for (let i = 0; i < LUT_SIZE; i++) {
    const v = i / (LUT_SIZE - 1);
    data[i * 4] = Math.round(sampleTable(r, v) * 255);
    data[i * 4 + 1] = Math.round(sampleTable(g, v) * 255);
    data[i * 4 + 2] = Math.round(sampleTable(b, v) * 255);
    // alpha 表按 1 − 明暗值取（与 SVG 滤镜里的 feColorMatrix 一致）
    data[i * 4 + 3] = Math.round(sampleTable(a, 1 - v) * 255);
  }
  return data;
}

// ── 指针：全局一份，所有画布共享 ────────────────────────────────────────

const pointer = { x: 0, y: 0, seen: false, listening: false };

function listenToPointer() {
  if (pointer.listening) return;
  pointer.listening = true;
  // 鼠标与触屏拖动都算「划过」；没有点击这回事
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.seen = true;
    },
    { passive: true },
  );
}

// ── 帧循环：全局一个 requestAnimationFrame，驱动所有画布 ─────────────────

type FrameCallback = (time: number, dt: number) => void;
const subscribers = new Set<FrameCallback>();
let frameId = 0;
let lastFrame = 0;

function loop(ms: number) {
  const time = ms / 1000;
  const dt = lastFrame ? Math.min(time - lastFrame, 0.1) : 0;
  lastFrame = time;
  subscribers.forEach((callback) => callback(time, dt));
  frameId = subscribers.size ? requestAnimationFrame(loop) : 0;
}

function subscribe(callback: FrameCallback) {
  subscribers.add(callback);
  if (!frameId) {
    lastFrame = 0;
    frameId = requestAnimationFrame(loop);
  }
  return () => {
    subscribers.delete(callback);
    if (!subscribers.size && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };
}

// ── 渲染器 ──────────────────────────────────────────────────────────────

export type InkParams = {
  /** 两档模糊的 sigma（CSS px） */
  tight: number;
  loose: number;
  /** 边缘起伏的幅度（CSS px） */
  displacement: number;
  /** 起伏与紧 / 松混合两张噪声的频率（每 CSS px） */
  warpFrequency: number;
  weightFrequency: number;
  /** 竖向偏置：越往下越渗得开（标志用），0 = 不偏 */
  spreadBias: number;
  /** 显影：水落下的点（画布坐标，CSS px）与最终半径；null = 不显影，直接出现 */
  reveal: { x: number; y: number; radius: number } | null;
  /**
   * 模糊在几分之一的分辨率上算。大面积的晕本来就柔，0.5 看不出差别、省四分之三的像素；
   * 小尺寸的元素（口号里的单词）细笔画会先被平均成灰色，要用 1
   */
  blurScale?: number;
};

export type InkLayout = {
  /** 画布尺寸（CSS px）—— 已经包含四周给晕留的余量 */
  width: number;
  height: number;
  /** 把形状画进源图：坐标是画布 CSS px，墨用黑色，纸已经铺好白色 */
  draw: (ctx: CanvasRenderingContext2D) => void;
  /** 必须保留一丝墨芯的细形状（可选），坐标同上 */
  drawCore?: (ctx: CanvasRenderingContext2D) => void;
  params: InkParams;
};

// 颗粒：幅度，以及每颗大约占几个设备像素。按设备像素定，高分屏上颗粒更细；
// 小于约 1.5 个设备像素会混叠成闪烁的白噪声
const GRAIN_AMOUNT = 0.05;
const GRAIN_DEVICE_PX = 1.6;
// 呼吸：改变明暗与紧 / 松比例的幅度、一呼一吸的周期（秒），以及相位噪声的空间尺度（约 320px）
const BREATH = 0.07;
const BREATH_WEIGHT = 0.35;
const BREATH_PERIOD = 7;
const BREATH_FREQUENCY = 1 / 320;
// 筷子：影响半径、位移上限（CSS px，按一根筷子的粗细取，太大会把整块墨都搅动），以及墨流回来的快慢（时间常数，秒）
const TRAIL_RADIUS = 30;
const TRAIL_MAX_SHIFT = 22;
const TRAIL_SHIFT_SETTLE = 0.9;
const TRAIL_CUT_SETTLE = 0.55;
// 划多快算「用力」：px/s
const TRAIL_FULL_SPEED = 1400;
// 拨动场的分辨率：每 4 个 CSS px 一格，场本身是平滑的
const TRAIL_SCALE = 0.25;
// 显影：前 18% 停顿，之后约 3.6 秒漫开（与手册第 08 章一致）
const REVEAL_DURATION = 4.4;
const REVEAL_PAUSE = 0.18;
// 画布像素密度上限：晕本来就是柔的，再高只会多算像素
const MAX_DPR = 2;
const BLUR_SCALE = 0.5;
// 细墨芯的模糊（CSS px）：只去掉锯齿，不让它化开
const CORE_SIGMA = 1;

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

function program(gl: WebGL2RenderingContext, fragment: string, names: string[]): Program {
  const p = gl.createProgram();
  if (!p) throw new Error("createProgram failed");
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(p, 0, "aPosition");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) ?? "program link failed");
  }
  const uniforms: Program["uniforms"] = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(p, name);
  return { program: p, uniforms };
}

function texture(gl: WebGL2RenderingContext, width: number, height: number, data: TexImageSource | Uint8Array | null) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (data instanceof Uint8Array || data === null) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }
  return tex;
}

// 源图：白底（纸），形状用黑色（墨），坐标按布局的 CSS px
function sourceCanvas(width: number, height: number, layout: InkLayout, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.scale(width / layout.width, height / layout.height);
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  paint(ctx);
  return canvas;
}

export class InkRenderer {
  private gl: WebGL2RenderingContext;
  private blur: Program;
  private trailProgram: Program;
  private ink: Program;
  private framebuffer: WebGLFramebuffer | null;
  private tight: WebGLTexture | null = null;
  private loose: WebGLTexture | null = null;
  private core: WebGLTexture | null = null;
  private trail: [WebGLTexture | null, WebGLTexture | null] = [null, null];
  private trailSize = { width: 1, height: 1 };
  private lut: WebGLTexture | null = null;
  private layout: InkLayout | null = null;
  private revealStart = 0;
  private lastPointer: { x: number; y: number } | null = null;
  // 拨动场是否还没回到原样；静下来之后不再每帧更新它
  private trailActive = false;
  private settleTime = 0;
  private dpr = 1;
  private unsubscribe: (() => void) | null = null;
  private visible = true;
  private needsDraw = true;

  /** 浏览器不支持 WebGL2 或着色器编译失败时返回 null */
  static create(canvas: HTMLCanvasElement) {
    try {
      const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
      return gl ? new InkRenderer(canvas, gl) : null;
    } catch {
      return null;
    }
  }

  private constructor(
    private canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
  ) {
    this.gl = gl;
    this.blur = program(gl, BLUR, ["uSource", "uStep", "uSigma", "uRadius"]);
    this.trailProgram = program(gl, TRAIL, [
      "uPrevious",
      "uSize",
      "uFrom",
      "uTo",
      "uStrength",
      "uRadius",
      "uDecay",
      "uCutDecay",
      "uMaxShift",
    ]);
    this.ink = program(gl, INK, [
      "uTight",
      "uLoose",
      "uCore",
      "uTrail",
      "uLut",
      "uSize",
      "uTime",
      "uFlow",
      "uDisplacement",
      "uWarpFrequency",
      "uWeightFrequency",
      "uSpreadBias",
      "uBreath",
      "uBreathWeight",
      "uBreathPeriod",
      "uBreathFrequency",
      "uGrain",
      "uGrainFrequency",
      "uMaxShift",
      "uReveal",
      "uRevealOn",
    ]);
    // 一个覆盖全屏的大三角形
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.framebuffer = gl.createFramebuffer();
    listenToPointer();
  }

  /** 形状或尺寸变了：重画源图、重算模糊、重置拨动场。代价较高，只在尺寸变化时调用 */
  setLayout(layout: InkLayout) {
    const { gl } = this;
    this.layout = layout;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(layout.width * dpr));
    this.canvas.height = Math.max(1, Math.round(layout.height * dpr));

    [this.tight, this.loose, this.core, ...this.trail].forEach((t) => gl.deleteTexture(t));

    // 1. 晕：形状在模糊用的分辨率上画成源图，做两档模糊
    const blurScale = layout.params.blurScale ?? BLUR_SCALE;
    const bw = Math.max(1, Math.round(this.canvas.width * blurScale));
    const bh = Math.max(1, Math.round(this.canvas.height * blurScale));
    const source = texture(gl, bw, bh, sourceCanvas(bw, bh, layout, layout.draw));
    const scratch = texture(gl, bw, bh, null);
    const texelsPerPx = bw / layout.width;
    [this.tight, this.loose] = [layout.params.tight, layout.params.loose].map((sigmaPx) =>
      this.blurInto(source, scratch, bw, bh, sigmaPx * texelsPerPx),
    );
    gl.deleteTexture(source);

    // 2. 细墨芯：没有的话放一张全白（= 纸）的 1×1，合成时取最小值就等于不起作用。
    //    墨芯要清楚，用画布的全分辨率画
    if (layout.drawCore) {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      const coreSource = texture(gl, cw, ch, sourceCanvas(cw, ch, layout, layout.drawCore));
      const coreScratch = texture(gl, cw, ch, null);
      this.core = this.blurInto(coreSource, coreScratch, cw, ch, CORE_SIGMA * dpr);
      gl.deleteTexture(coreSource);
      gl.deleteTexture(coreScratch);
    } else {
      this.core = texture(gl, 1, 1, new Uint8Array([255, 255, 255, 255]));
    }
    gl.deleteTexture(scratch);

    // 3. 拨动场：两张纹理来回倒，初始为「没有位移、没有口子」
    const tw = Math.max(1, Math.round(layout.width * TRAIL_SCALE));
    const th = Math.max(1, Math.round(layout.height * TRAIL_SCALE));
    this.trailSize = { width: tw, height: th };
    this.trail = [texture(gl, tw, th, null), texture(gl, tw, th, null)];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    this.trail.forEach((t) => {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.viewport(0, 0, tw, th);
      gl.clearColor(0.5, 0.5, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.lastPointer = null;
    this.trailActive = false;
    this.needsDraw = true;
  }

  private blurInto(
    source: WebGLTexture | null,
    scratch: WebGLTexture | null,
    width: number,
    height: number,
    sigma: number,
  ) {
    const out = texture(this.gl, width, height, null);
    const s = Math.max(0.5, sigma);
    // 半径 3σ，taps 上限 64：超出时按步长跨着采
    const stride = Math.max(1, (s * 3) / 64);
    this.blurPass(source, scratch, width, height, [stride / width, 0], s / stride);
    this.blurPass(scratch, out, width, height, [0, stride / height], s / stride);
    return out;
  }

  private blurPass(
    from: WebGLTexture | null,
    to: WebGLTexture | null,
    width: number,
    height: number,
    step: [number, number],
    sigmaTaps: number,
  ) {
    const { gl, blur } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, to, 0);
    gl.viewport(0, 0, width, height);
    gl.useProgram(blur.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from);
    gl.uniform1i(blur.uniforms.uSource, 0);
    gl.uniform2f(blur.uniforms.uStep, step[0], step[1]);
    gl.uniform1f(blur.uniforms.uSigma, sigmaTaps);
    gl.uniform1i(blur.uniforms.uRadius, Math.min(64, Math.ceil(sigmaTaps * 3)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** 换主题：只换查找表 */
  setTables(tables: InkTables) {
    const { gl } = this;
    if (this.lut) gl.deleteTexture(this.lut);
    this.lut = texture(gl, LUT_SIZE, 1, buildLut(tables));
    this.needsDraw = true;
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (visible) this.needsDraw = true;
  }

  /** 开始渲染。animated = false（减弱动画）时：不显影、不流动、不呼吸、不响应鼠标，只画静止画面 */
  start(animated: boolean) {
    this.revealStart = performance.now() / 1000;
    this.unsubscribe?.();
    this.unsubscribe = subscribe((time, dt) => {
      if (!this.visible || document.hidden || !this.layout || !this.lut) return;
      if (!animated) {
        if (this.needsDraw) this.draw(time, false);
        return;
      }
      this.stir(dt);
      this.draw(time, true);
    });
  }

  /** 筷子：把鼠标这一帧划过的线段盖进拨动场，并让整张场衰减（墨流回来） */
  private stir(dt: number) {
    const { gl, layout } = this;
    if (!layout || dt <= 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const sx = layout.width / (rect.width || 1);
    const sy = layout.height / (rect.height || 1);
    const here = pointer.seen ? { x: (pointer.x - rect.left) * sx, y: (pointer.y - rect.top) * sy } : null;
    const from = this.lastPointer ?? here;
    this.lastPointer = here;

    let strength = 0;
    if (here && from) {
      const distance = Math.hypot(here.x - from.x, here.y - from.y);
      // 只有真的划过画布附近才算；划得越快口子越大
      const near =
        Math.min(here.x, from.x) < layout.width + TRAIL_RADIUS &&
        Math.max(here.x, from.x) > -TRAIL_RADIUS &&
        Math.min(here.y, from.y) < layout.height + TRAIL_RADIUS &&
        Math.max(here.y, from.y) > -TRAIL_RADIUS;
      if (near && distance > 0.5) strength = Math.min(1, distance / dt / TRAIL_FULL_SPEED);
    }
    // 场已经静下来、这一帧也没有划动：省掉这一遍
    if (!strength && !this.trailActive) return;
    if (strength) {
      this.trailActive = true;
      this.settleTime = 0;
    } else {
      // 大约 5 个时间常数后场已经回到原样，之后不再每帧更新
      this.settleTime += dt;
      if (this.settleTime > TRAIL_SHIFT_SETTLE * 5) this.trailActive = false;
    }

    const [previous, next] = this.trail;
    const { trailProgram: tp } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, next, 0);
    gl.viewport(0, 0, this.trailSize.width, this.trailSize.height);
    gl.useProgram(tp.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, previous);
    gl.uniform1i(tp.uniforms.uPrevious, 0);
    gl.uniform2f(tp.uniforms.uSize, layout.width, layout.height);
    gl.uniform2f(tp.uniforms.uFrom, from?.x ?? 0, from?.y ?? 0);
    gl.uniform2f(tp.uniforms.uTo, here?.x ?? 0, here?.y ?? 0);
    gl.uniform1f(tp.uniforms.uStrength, strength);
    gl.uniform1f(tp.uniforms.uRadius, TRAIL_RADIUS);
    gl.uniform1f(tp.uniforms.uDecay, Math.exp(-dt / TRAIL_SHIFT_SETTLE));
    gl.uniform1f(tp.uniforms.uCutDecay, Math.exp(-dt / TRAIL_CUT_SETTLE));
    gl.uniform1f(tp.uniforms.uMaxShift, TRAIL_MAX_SHIFT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.trail = [next, previous];
  }

  private draw(time: number, animated: boolean) {
    const { gl, ink, layout } = this;
    if (!layout) return;
    this.needsDraw = false;
    const { params } = layout;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(ink.program);
    const u = ink.uniforms;

    [this.tight, this.loose, this.core, this.trail[0], this.lut].forEach((tex, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    });
    gl.uniform1i(u.uTight, 0);
    gl.uniform1i(u.uLoose, 1);
    gl.uniform1i(u.uCore, 2);
    gl.uniform1i(u.uTrail, 3);
    gl.uniform1i(u.uLut, 4);

    gl.uniform2f(u.uSize, layout.width, layout.height);
    gl.uniform1f(u.uTime, animated ? time : 0);
    gl.uniform1f(u.uFlow, animated ? 1 : 0);
    gl.uniform1f(u.uDisplacement, params.displacement);
    gl.uniform1f(u.uWarpFrequency, params.warpFrequency);
    gl.uniform1f(u.uWeightFrequency, params.weightFrequency);
    gl.uniform1f(u.uSpreadBias, params.spreadBias);
    gl.uniform1f(u.uBreath, animated ? BREATH : 0);
    gl.uniform1f(u.uBreathWeight, animated ? BREATH_WEIGHT : 0);
    gl.uniform1f(u.uBreathPeriod, BREATH_PERIOD);
    gl.uniform1f(u.uBreathFrequency, BREATH_FREQUENCY);
    gl.uniform1f(u.uGrain, GRAIN_AMOUNT);
    gl.uniform1f(u.uGrainFrequency, this.dpr / GRAIN_DEVICE_PX);
    gl.uniform1f(u.uMaxShift, TRAIL_MAX_SHIFT);

    const reveal = params.reveal;
    if (animated && reveal) {
      const progress = Math.max(0, (time - this.revealStart) / REVEAL_DURATION - REVEAL_PAUSE) / (1 - REVEAL_PAUSE);
      // 接近匀速，末尾放缓
      const eased = progress >= 1 ? 1 : 1 - Math.pow(1 - progress, 1.6);
      gl.uniform3f(u.uReveal, reveal.x, reveal.y, reveal.radius * eased);
      gl.uniform1f(u.uRevealOn, progress >= 1 ? 0 : 1);
    } else {
      gl.uniform1f(u.uRevealOn, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.unsubscribe?.();
    const { gl } = this;
    [this.tight, this.loose, this.core, ...this.trail, this.lut].forEach((t) => gl.deleteTexture(t));
    gl.deleteFramebuffer(this.framebuffer);
    gl.deleteProgram(this.blur.program);
    gl.deleteProgram(this.trailProgram.program);
    gl.deleteProgram(this.ink.program);
  }
}
