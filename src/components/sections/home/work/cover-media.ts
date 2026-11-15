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
    video.preload = "none";
    video.src = url;
    videos.set(id, video);
  }
  return video;
}

/** 只让一个视频在播：化开的那一个。其余暂停；播放被拒绝时静默 */
export function playOnly(active: HTMLVideoElement | null) {
  videos.forEach((video) => {
    if (video !== active && !video.paused) video.pause();
  });
  active?.play().catch(() => {});
}
