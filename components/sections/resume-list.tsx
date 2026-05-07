"use client";

import Image from "next/image";
import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import type { ResumeItem } from "@/types";

const portableComponents: Partial<PortableTextReactComponents> = {
  block: {
    normal: ({ children }) => <p className="text-sm leading-relaxed text-neutral-600">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-1 pl-4 text-sm text-neutral-600">{children}</ul>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
  },
};

type ResumeListProps = {
  items: ResumeItem[];
  fallbackData: ResumeItem[];
};

export function ResumeList({ items, fallbackData }: ResumeListProps) {
  const displayData = items && items.length > 0 ? items : fallbackData;

  return (
    <div className="mt-4 space-y-6 text-neutral-800">
      {displayData.map((edu, idx) => {
        const id = edu._id || `edu-${idx}`;
        const hasDetails = edu.details && edu.details.length > 0;

        return (
          <div key={id} className="group relative flex items-stretch gap-3">
            {/* The vertical diamond bullet */}
            <Image
              src="/diamond_2.svg"
              alt=""
              width={20}
              height={20}
              className="h-full min-h-[72px] w-5 self-stretch"
              priority
            />
            
            <div className="flex flex-1 flex-col gap-4 sm:flex-row pb-2">
              {/* 左侧：基础信息 */}
              <div className={`flex flex-col ${hasDetails ? 'sm:w-1/2' : 'w-full'}`}>
                <p className="text-base font-semibold">{edu.institution}</p>
                <p className="text-sm text-neutral-700">{edu.degree}</p>
                <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                  <span>{edu.period}</span>
                  {edu.location && (
                    <>
                      <span className="text-neutral-400">&middot;</span>
                      <span>{edu.location}</span>
                    </>
                  )}
                </div>
                
                {/* 移动端提示 / 桌面端无缝过渡提示 */}
                {hasDetails && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-neutral-400 opacity-60 transition-opacity group-hover:opacity-0 sm:hidden">
                    <span>Hover or tap for details</span>
                  </div>
                )}
              </div>

              {/* 右侧：详细信息 (占据右侧固定空间，Hover 时淡入) */}
              {hasDetails && (
                <div className="sm:w-1/2 text-sm text-neutral-600 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 sm:pl-4 sm:border-l sm:border-neutral-200">
                  <PortableText value={edu.details!} components={portableComponents} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
