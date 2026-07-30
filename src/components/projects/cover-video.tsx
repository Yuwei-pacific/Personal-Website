"use client";

// 项目详情页的封面视频：静音自动循环播放，并提供独立的播放 / 暂停控制。
// - muted 是浏览器允许自动播放的前提，不加就会被策略拦下
// - 只在进入视口时播放、离开即暂停，页面滚走后不再占用解码资源
// - 尊重「减弱动画」偏好：该偏好开启时不自动播放，由访客主动播放
// - 记住访客的手动暂停，重新进入视口时不会擅自恢复
import { useEffect, useRef, useState } from "react";
import { LuPause, LuPlay } from "react-icons/lu";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type CoverVideoProps = {
  src: string;
  poster: string;
  className?: string;
};

export function CoverVideo({ src, poster, className }: CoverVideoProps) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // play() 在自动播放策略下可能 reject，静默忽略即可
        if (entry.isIntersecting && !userPausedRef.current) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      userPausedRef.current = false;
      video.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className={className}
      />
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause cover video" : "Play cover video"}
        className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center border border-design-dark-text-primary/40 bg-design-dark-bg/60 text-design-dark-text-primary backdrop-blur-md transition-colors duration-base hover:bg-design-dark-bg/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-design-dark-bg"
      >
        {isPlaying ? (
          <LuPause className="h-4 w-4" aria-hidden />
        ) : (
          <LuPlay className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
