"use client";

import { useState } from "react";
import { LuArrowDown } from "react-icons/lu";
import { PortableText, type PortableTextReactComponents } from "next-sanity";
import type { ResumeItem } from "@/lib/view-models/types";
import { InkRule } from "@/components/ui/ink-rule";
import { StaggerReveal } from "@/components/ui/stagger-reveal";
import { cn } from "@/lib/utils";
import { infoListClassName, infoRowFocusClassName } from "./info-list";

const portableComponents: Partial<PortableTextReactComponents> = {
  block: {
    normal: ({ children }) => <p className="text-small leading-relaxed text-design-light-text-secondary">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-1 pl-4 text-small text-design-light-text-secondary">{children}</ul>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
  },
};

type ResumeListProps = {
  items: ResumeItem[];
  emptyLabel: string;
};

export function ResumeList({ items, emptyLabel }: ResumeListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 内容来源只有 CMS：没有条目就不渲染表格，而不是回退到仓库里的副本
  if (!items.length) {
    return (
      <>
        <InkRule />
        <p className="pt-4 text-small text-design-light-text-muted">{emptyLabel}</p>
      </>
    );
  }

  return (
    <>
    {/* 顶上的主线和行间的线都是墨线（ui/ink-rule.tsx） */}
    <InkRule variant={items.length} />
    <StaggerReveal className={infoListClassName}>
      {items.map((edu, idx) => {
        const id = edu._id || `edu-${idx}`;
        const hasDetails = edu.details.length > 0;
        const isExpanded = expandedId === id;

        // 最后一列留给展开箭头；不可展开的行也占着这一列，各行的内容列才能对齐。
        // 窄屏单列时箭头绝对定位在右上角，右内边距给它让位。
        const rowClassName = "grid grid-cols-1 gap-1.5 py-5 pr-8 sm:grid-cols-[1.5fr_1.6fr_0.9fr_0.8fr_1.25rem] sm:items-baseline sm:gap-6 sm:pr-0";
        const rowContent = (
          <>
            {/* 机构名用衬线字，和首页目录里的项目名同一个样子 */}
            <p className="font-display text-[clamp(1.25rem,1.7vw,1.5rem)] leading-tight text-design-light-text-primary">{edu.institution}</p>
            <p className="text-small text-design-light-text-secondary">{edu.degree}</p>
            <p className="text-small text-design-light-text-muted">{edu.period}</p>
            <p className="text-small text-design-light-text-muted">{edu.location}</p>
          </>
        );

        return (
          <div key={id}>
            {/* 悬停聚焦加在这一层而不是外层：外层是 StaggerReveal 的直接子元素（见 info-list.ts）。
                展开中的条目不参与变淡 —— 正在读的内容不该因为鼠标移到别处而暗下去 */}
            <div className={cn(infoRowFocusClassName, isExpanded && "!opacity-100")}>
            {hasDetails ? (
              // 可展开条目：使用 button 保证键盘可达，并暴露展开状态给辅助技术。
              // 只有可展开的行才有箭头、悬停右移和手型光标 —— 这三样就是「能点」的全部信号
              <button
                type="button"
                onClick={() => toggleExpand(id)}
                aria-expanded={isExpanded}
                aria-controls={`resume-details-${id}`}
                className={cn(
                  rowClassName,
                  "group/row relative w-full cursor-pointer text-left transition-[padding] duration-base hover:pl-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-design-light-accent motion-reduce:transition-none",
                )}
              >
                {rowContent}
                <LuArrowDown
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1 top-5 h-4 w-4 transition-[transform,color] duration-base ease-design-out group-hover/row:text-design-light-text-primary motion-reduce:transition-none sm:static sm:justify-self-end",
                    isExpanded
                      ? "rotate-180 text-design-light-text-primary"
                      : "text-design-light-text-muted",
                  )}
                />
              </button>
            ) : (
              <div className={rowClassName}>
                {rowContent}
                <span aria-hidden="true" className="hidden sm:block" />
              </div>
            )}

            {hasDetails && (
              <div
                id={`resume-details-${id}`}
                // grid-rows-[0fr] + opacity-0 只是视觉折叠，内容仍在无障碍树里：
                // 读屏会念出全部详情，与按钮上的 aria-expanded="false" 自相矛盾，
                // 里面若出现链接还会变成不可见的焦点目标。inert 不影响布局，
                // 因此展开动画照常。
                inert={!isExpanded}
                className={`grid overflow-hidden transition-[grid-template-rows,opacity,padding] duration-base ease-design-out ${isExpanded ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <PortableText value={edu.details} components={portableComponents} />
                </div>
              </div>
            )}
            </div>
            <InkRule tone="soft" variant={idx + 1} />
          </div>
        );
      })}
    </StaggerReveal>
    </>
  );
}
