"use client";

// 项目详情页的封面视频：静音自动循环播放，不显示控制条（当作动态封面而非播放器）。
// - muted 是浏览器允许自动播放的前提，不加就会被策略拦下
// - 只在进入视口时播放、离开即暂停，页面滚走后不再占用解码资源
// - 尊重「减弱动画」偏好：该偏好开启时不自动播放，改为显示控制条，
//   否则访客将没有任何手段看到这段视频
import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type CoverVideoProps = {
  src: string;
  poster: string;
  className?: string;
};

export function CoverVideo({ src, poster, className }: CoverVideoProps) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // play() 在自动播放策略下可能 reject，静默忽略即可
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      // 自动播放时当作动态封面，不露控件；减弱动画偏好下不自动播，
      // 这时必须给出控件，否则这段内容就完全无法访问了
      controls={reducedMotion}
      preload="metadata"
      className={className}
    />
  );
}
