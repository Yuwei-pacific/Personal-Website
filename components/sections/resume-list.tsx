"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mt-4 space-y-6 text-neutral-800">
      {displayData.map((edu, idx) => {
        const id = edu._id || `edu-${idx}`;
        const hasDetails = edu.details && edu.details.length > 0;
        const isExpanded = expandedId === id;

        return (
          <div 
            key={id} 
            className={`group relative flex items-stretch gap-3 ${hasDetails ? 'cursor-pointer' : ''}`}
            onClick={() => hasDetails && toggleExpand(id)}
          >
            {/* The vertical diamond bullet */}
            <Image
              src="/diamond_2.svg"
              alt=""
              width={20}
              height={20}
              className="h-full min-h-[72px] w-5 self-stretch"
              priority
            />
            
            <div className="flex flex-1 flex-col sm:flex-row pb-2">
              {/* Left: basic info */}
              <div className={`flex flex-col ${hasDetails ? 'sm:w-[40%] sm:pr-6' : 'w-full'}`}>
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
              </div>

              {/* Right: arrow hint fades out, details fade in — same space */}
              {hasDetails && (
                <div className="relative flex flex-1 flex-col sm:w-[60%]">
                  {/* Arrow hint — visible by default, positioned at bottom right, fades out on hover/click */}
                  <div className={`absolute bottom-0 right-2 flex items-center gap-1 text-neutral-400 transition-all duration-300 ${isExpanded ? 'opacity-0 translate-x-1 -translate-y-1' : 'group-hover:opacity-0 group-hover:translate-x-1 group-hover:-translate-y-1'}`}>
                    <ArrowUpRight className="h-6 w-6" />
                  </div>
                  
                  {/* Details & Divider — hidden by default, expands and fades in on hover/click */}
                  <div className={`grid transition-all duration-300 ease-out sm:pl-6 relative ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100'}`}>
                    {/* Vertical divider - shows on hover, inside the grid to control height */}
                    <div className="hidden sm:block absolute inset-y-0 left-0 w-px bg-neutral-200" />
                    
                    <div className="overflow-hidden">
                      {/* On mobile, add top padding ONLY when content is visible via the grid expansion */}
                      <div className="text-sm text-neutral-600 pt-4 sm:pt-0">
                        <PortableText value={edu.details!} components={portableComponents} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
