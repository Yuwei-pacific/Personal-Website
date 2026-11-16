import type { ReactNode } from "react";

import { InkRule } from "@/components/ui/ink-rule";

const metaItemTones = {
  light: {
    border: "text-design-light-border-strong",
    label: "text-design-light-text-muted",
    value: "text-design-light-text-primary",
  },
  dark: {
    border: "text-design-dark-border-strong",
    label: "text-design-dark-text-muted",
    value: "text-design-dark-text-primary",
  },
} as const;

export type MetaTone = keyof typeof metaItemTones;

// 元信息列表：首屏（浅色）与 Credits（深色）共用同一套「标签 / 值」行。
// 每行只画上边线，最后一条底线由 MetaList 补上。线是墨线（ui/ink-rule.tsx），和 About 页一致；
// 每行按标签取一种起伏，免得几条线一模一样。
export function MetaList({
  tone,
  className = "",
  children,
}: {
  tone: MetaTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <dl className={className}>
      {children}
      <InkRule tone="soft" variant={2} className={metaItemTones[tone].border} />
    </dl>
  );
}

export function MetaItem({
  label,
  tone,
  children,
}: {
  label: string;
  tone: MetaTone;
  children: ReactNode;
}) {
  const t = metaItemTones[tone];

  return (
    <>
      <InkRule tone="soft" variant={label.length} className={t.border} />
      <div className="grid grid-cols-[7rem_1fr] gap-4 py-3 text-small sm:grid-cols-[9rem_1fr]">
        <dt className={t.label}>{label}</dt>
        <dd className={t.value}>{children}</dd>
      </div>
    </>
  );
}

/** 多值字段（角色、合作者、技能）统一用间隔号连接 */
export const joinMeta = (items: string[]) => items.join(" · ");
