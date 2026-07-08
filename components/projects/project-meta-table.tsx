import type { ReactNode } from "react";

const metaRowTones = {
  light: {
    row: "border-design-light-border sm:hover:bg-design-light-hover",
    label: "text-design-light-text-primary",
    value: "text-design-light-text-secondary",
  },
  dark: {
    row: "border-design-dark-border sm:hover:bg-design-dark-surface",
    label: "text-design-dark-text-primary",
    value: "text-design-dark-text-secondary",
  },
} as const;

type MetaRowProps = {
  label: string;
  tone?: keyof typeof metaRowTones;
  children: ReactNode;
};

export function MetaRow({ label, tone = "light", children }: MetaRowProps) {
  const t = metaRowTones[tone];

  return (
    <div
      className={`grid grid-cols-1 gap-1 border-b px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 ${t.row}`}
    >
      <p className={`font-semibold ${t.label}`}>{label}</p>
      <div className={`text-small sm:text-body ${t.value}`}>{children}</div>
    </div>
  );
}

export function DotList({ items, separatorClassName }: { items: string[]; separatorClassName: string }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1.5">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-2">
          {index > 0 && <span className={separatorClassName}>·</span>}
          {item}
        </span>
      ))}
    </div>
  );
}
