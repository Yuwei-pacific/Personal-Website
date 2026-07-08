import type { PortableTextBlock } from "@portabletext/types";

export const text = (value: string | null | undefined, fallback = "") =>
  value?.trim() || fallback;

export const optionalText = (value: string | null | undefined) => {
  const resolved = text(value);
  return resolved || null;
};

export const stringList = (items: string[] | null | undefined) =>
  (items ?? []).map((item) => item.trim()).filter(Boolean);

export const blocks = (value: unknown): PortableTextBlock[] =>
  Array.isArray(value) ? (value as PortableTextBlock[]) : [];
