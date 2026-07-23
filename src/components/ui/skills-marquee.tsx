"use client";

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

const skillsGroup = [...baseSkills, ...baseSkills];
const WAVE_DURATION_SECONDS = 8;
const WAVE_CYCLES = 2;

export function SkillsMarquee({ className }: { className?: string }) {
  return (
    // 纯装饰性轮播：技能已在 Capabilities 区完整列出，这里对辅助技术隐藏，避免重复朗读
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-[180px] w-full items-center overflow-hidden",
        className
      )}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div className="flex h-full w-max animate-marquee items-center will-change-transform motion-reduce:animate-none">
        {[0, 1].map((groupIndex) => (
          <ul key={groupIndex} className="flex shrink-0 items-center gap-4 px-2">
            {skillsGroup.map((skill, index) => {
              const delay = `-${(index * WAVE_DURATION_SECONDS * WAVE_CYCLES) / skillsGroup.length}s`;
              return (
                <li
                  key={`${groupIndex}-${skill.name}-${index}`}
                  className="flex items-center justify-center"
                >
                  <div
                    className="flex h-20 w-20 animate-bounce-sine items-center justify-center rounded-full border border-design-light-border bg-design-light-surface text-design-light-text-primary transition-[background-color,border-color,color,transform] [transition-duration:var(--motion-duration-base)] hover:scale-105 hover:bg-design-light-hover motion-reduce:animate-none md:h-24 md:w-24"
                    style={{ animationDelay: delay }}
                    title={skill.name}
                  >
                    {skill.icon}
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
