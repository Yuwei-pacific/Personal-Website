import type { PortableTextBlock } from "@portabletext/types";

export type ResumeItem = {
  _id?: string;
  type?: 'education' | 'experience';
  institution: string;
  degree?: string;
  location?: string;
  period?: string;
  details?: PortableTextBlock[];
  order?: number;
};
