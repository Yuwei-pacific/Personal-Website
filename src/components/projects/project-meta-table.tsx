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

const metaRowDensities = {
  default: {
    row: "py-4",
    label: "",
    value: "text-small sm:text-body",
  },
  compact: {
    row: "py-3",
    label: "text-small",
    value: "text-small leading-5",
  },
} as const;

type MetaRowProps = {
  label: string;
  tone?: keyof typeof metaRowTones;
  density?: keyof typeof metaRowDensities;
  children: ReactNode;
};

export function MetaRow({
  label,
  tone = "light",
  density = "default",
  children,
}: MetaRowProps) {
  const t = metaRowTones[tone];
  const d = metaRowDensities[density];

  return (
    <div
      className={`grid grid-cols-1 gap-1 border-b px-1 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 ${d.row} ${t.row}`}
    >
      <p className={`font-semibold ${d.label} ${t.label}`}>{label}</p>
      <div className={`${d.value} ${t.value}`}>{children}</div>
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
