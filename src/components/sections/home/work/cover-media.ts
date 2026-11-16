// Work 区封面的图像与视频：都要上传成 WebGL 纹理（封面显在墨里），所以必须带 crossOrigin ——
// 没有 CORS 的图像会「污染」画布，上传时抛 SecurityError。Sanity CDN 允许跨域。
//
// 失败一律不抛：图像加载不到，那滩墨就是纯墨；视频放不了（浏览器拒绝自动播放、低电量模式），
// 就停在彩色的静止封面上。

/** 加载封面图像；失败返回 null */
export function loadCoverImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

// 每个项目一个 <video>，建一次、复用。不挂进 DOM：画面由渲染器每帧取样
const videos = new Map<string, HTMLVideoElement>();

/** 项目的封面视频（静音、循环、内联播放）。preload="none"：第一次播放时才开始加载 */
export function coverVideo(id: string, url: string): HTMLVideoElement {
  let video = videos.get(id);
  if (!video) {
    video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    // iOS Safari 认的是标签上的属性：没有它，视频一播放就会被拉成全屏
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.preload = "none";
    video.src = url;
    videos.set(id, video);
  }
  return video;
}

// 同一时间只播一个视频。两层：焦点作品的视频（WorkInk 随滚动设定），与目录悬停预览的视频
// （悬停期间临时接管）。预览结束时回到焦点作品的视频 —— 否则移开目录后，它要等下一次焦点变化才继续播。
let focusVideo: HTMLVideoElement | null = null;
let previewing = false;

function playOnly(active: HTMLVideoElement | null) {
  videos.forEach((video) => {
    if (video !== active && !video.paused) video.pause();
  });
  // 播放被拒绝（自动播放策略、低电量模式）时静默：停在静止封面上
  active?.play().catch(() => {});
}

/** 焦点作品的视频（没有视频或不该播时传 null）。悬停预览期间只记下，不抢播放 */
export function playFocusVideo(video: HTMLVideoElement | null) {
  focusVideo = video;
  if (!previewing) playOnly(video);
}

/** 目录悬停预览：暂停焦点视频，播放这个项目的视频（没有就传 null，只暂停） */
export function playPreviewVideo(video: HTMLVideoElement | null) {
  previewing = true;
  playOnly(video);
}

/** 预览结束：回到焦点作品的视频 */
export function endPreviewVideo() {
  if (!previewing) return;
  previewing = false;
  playOnly(focusVideo);
}
