import type { SanityImageSource } from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/types";

export type ProjectCoverImage = SanityImageSource & {
  alt: string;
  asset?: {
    _id?: string;
    url?: string | null;
  } | null;
};

export type Project = {
  _id: string;
  title: string;
  summary: string;
  year: number | null;
  projectType: string | null;
  slug: string | null;
  coverImage: ProjectCoverImage | null;
};

export type ProjectGalleryItem = {
  key: string;
  url: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
};

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
  } | null;
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
