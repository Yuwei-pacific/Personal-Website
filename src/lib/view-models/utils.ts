import type { PortableTextBlock } from "next-sanity";
import type { ProjectVideo } from "./types";

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

/** Sanity file 资源 → 视频视图模型；没有 URL 视为未设置 */
export const video = (
  source: { url?: string | null; mimeType?: string | null } | null | undefined
): ProjectVideo | null => {
  const url = text(source?.url);
  if (!url) return null;

  return { url, mimeType: text(source?.mimeType, "video/mp4") };
};
