import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url";

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
