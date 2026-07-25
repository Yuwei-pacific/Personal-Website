import type { SanityImageSource } from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/types";

export type ProjectCoverImage = SanityImageSource & {
  alt: string;
  /** 动图（GIF）：生成 URL 时必须跳过 auto=format，否则只剩第一帧 */
  animated: boolean;
  asset?: {
    _id?: string;
    url?: string | null;
  } | null;
};

/** 可选的封面视频：卡片 hover 时静音循环播放 */
export type ProjectVideo = {
  url: string;
  mimeType: string;
};

export type Project = {
  _id: string;
  title: string;
  summary: string;
  year: number | null;
  projectType: string | null;
  slug: string | null;
  coverImage: ProjectCoverImage | null;
  coverVideo: ProjectVideo | null;
};

// 每个画廊条目都一定有一张图片：它是网格缩略图、布局宽高比的来源，
// 视频条目里还兼任封面帧。视频只是在这之上附加的可播放源。
type ProjectGalleryItemBase = {
  key: string;
  alt: string;
  caption: string | null;
  imageUrl: string;
  /** 动图（GIF）：生成 URL 时必须跳过 auto=format，否则只剩第一帧 */
  imageAnimated: boolean;
  width: number;
  height: number;
};

export type ProjectGalleryImage = ProjectGalleryItemBase & {
  kind: "image";
};

export type ProjectGalleryVideo = ProjectGalleryItemBase & {
  kind: "video";
  videoUrl: string;
  mimeType: string;
};

export type ProjectGalleryItem = ProjectGalleryImage | ProjectGalleryVideo;

export type ProjectLink = {
  key: string;
  label: string;
  href: string | null;
  originalUrl: string | null;
};

export type ProjectDetail = {
  _id: string;
  title: string;
  summary: string;
  role: string[];
  tags: string[];
  contributors: string[];
  slug: string;
  year: number | null;
  projectType: string | null;
  client: string | null;
  location: string | null;
  links: ProjectLink[];
  coverImage: {
    url: string;
    alt: string;
    animated: boolean;
  } | null;
  coverVideo: ProjectVideo | null;
  gallery: ProjectGalleryItem[];
  body: PortableTextBlock[];
  myContribution: PortableTextBlock[];
};

export type ResumeItem = {
  _id: string;
  type: "education" | "experience";
  institution: string;
  degree: string;
  location: string;
  period: string;
  details: PortableTextBlock[];
  order: number | null;
};

export type SkillCategory = {
  _id: string;
  title: string;
  order: number | null;
  skills: string[];
};
