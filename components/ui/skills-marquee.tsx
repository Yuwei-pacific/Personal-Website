"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  SiFigma,
  SiReact,
  SiTailwindcss,
  SiBlender,
  SiUnity,
} from "react-icons/si";
import { RiNextjsLine } from "react-icons/ri";
import { FiGithub } from "react-icons/fi";
import {
  TbBrandAdobeAfterEffect,
  TbBrandAdobeIllustrator,
  TbBrandAdobePremier
} from "react-icons/tb";
import { LiaAdobe } from "react-icons/lia";


const baseSkills = [
  { name: "React", icon: <SiReact className="w-8 h-8" /> },
  { name: "Next.js", icon: <RiNextjsLine className="w-8 h-8" /> },
  { name: "Tailwind CSS", icon: <SiTailwindcss className="w-8 h-8" /> },
  { name: "GitHub", icon: <FiGithub className="w-8 h-8" /> },
  { name: "Figma", icon: <SiFigma className="w-8 h-8" /> },
  { name: "AdobeAfterEffect", icon: <TbBrandAdobeAfterEffect className="w-8 h-8" /> },
  { name: "AdobeIllustrator", icon: <TbBrandAdobeIllustrator className="w-8 h-8" /> },
  { name: "AdobePremier", icon: <TbBrandAdobePremier className="w-8 h-8" /> },
  { name: "Adobe", icon: <LiaAdobe className="w-8 h-8" /> },
  { name: "Blender", icon: <SiBlender className="w-8 h-8" /> },
  { name: "Unity", icon: <SiUnity className="w-8 h-8" /> },
];

// 为了确保不管页面有多长、滚动多远都不露馅，我们把基本图标多复制几次
// 生成一个超长的序列
const skillsGroup = Array(10).fill(baseSkills).flat();

export function SkillsMarquee({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${-window.scrollY * 0.3}px, 0, 0)`;
          }
          animationFrameId = 0;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // 初始化时获取一次
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full h-[200px] overflow-hidden flex items-center",
        className
      )}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      {/* 
        不再使用 animate-marquee 自动滑动，
        而是根据窗口的 scrollY 动态设置 translateX 偏移量。
        乘以一个系数（比如 0.8）可以控制它响应滚动的视差速度。
      */}
      <div
        ref={containerRef}
        className="flex w-max items-center h-full will-change-transform"
      >
        <ul className="flex shrink-0 items-center justify-around px-2">
          {skillsGroup.map((skill, index) => {
            const delay = `${index * -0.3}s`;
            return (
              <li
                key={`group-${index}`}
                className="flex items-center justify-center mx-2"
              >
                {/* 这一层依然保留正弦波的上下浮动效果 */}
                <div
                  className="animate-bounce-sine flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border border-neutral-200 text-neutral-900 transition-all hover:scale-110 hover:bg-neutral-100 cursor-pointer"
                  style={{ animationDelay: delay }}
                  title={skill.name}
                >
                  {skill.icon}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
