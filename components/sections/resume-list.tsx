"use client";

import { useState } from "react";
import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import type { ResumeItem } from "@/types";
import { StaggerReveal } from "@/components/ui/stagger-reveal";

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
    <StaggerReveal className="mt-6 border-t border-neutral-300">
      {displayData.map((edu, idx) => {
        const id = edu._id || `edu-${idx}`;
        const hasDetails = edu.details && edu.details.length > 0;
        const isExpanded = expandedId === id;

        return (
          <div
            key={id}
            className={`border-b border-neutral-300 ${hasDetails ? 'cursor-pointer' : ''}`}
            onClick={() => hasDetails && toggleExpand(id)}
          >
            <div className="group grid grid-cols-1 gap-1.5 px-1 py-5 transition-[padding,background-color] duration-300 sm:grid-cols-[1.4fr_1.6fr_1fr_0.8fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-neutral-50">
              <p className="font-semibold text-neutral-900">{edu.institution}</p>
              <p className="text-sm text-neutral-700 sm:text-base">{edu.degree}</p>
              <p className="text-sm text-neutral-500">{edu.period}</p>
              <p className="text-sm text-neutral-500">{edu.location}</p>
            </div>

            {hasDetails && (
              <div
                className={`grid overflow-hidden px-1 transition-all duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <PortableText value={edu.details!} components={portableComponents} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </StaggerReveal>
  );
}
