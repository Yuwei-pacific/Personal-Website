import type { Project, ResumeItem, SkillCategory } from "@/types";
import type {
  PROJECTS_QUERYResult,
  RESUME_QUERYResult,
  SKILLS_QUERYResult,
} from "@/sanity/sanity.types";
import { blocks, optionalText, stringList, text } from "./utils";

const resumeType = (value: RESUME_QUERYResult[number]["type"]): ResumeItem["type"] | null =>
  value === "education" || value === "experience" ? value : null;

export function normalizeProjects(items: PROJECTS_QUERYResult = []): Project[] {
  return items.map((item) => {
    const title = text(item.title, "Untitled project");
    return {
      _id: item._id,
      title,
      summary: text(item.summary),
      year: item.year ?? null,
      projectType: optionalText(item.projectType),
      slug: optionalText(item.slug),
      coverImage: item.coverImage?.asset
        ? {
            ...item.coverImage,
            alt: text(item.coverImage.alt, `${title} cover image`),
          }
        : null,
    };
  });
}

export function normalizeSkillCategories(items: SKILLS_QUERYResult = []): SkillCategory[] {
  return items.map((item) => ({
    _id: item._id,
    title: text(item.title, "Untitled category"),
    order: item.order ?? null,
    skills: stringList(item.skills),
  }));
}

export function normalizeResumeItems(items: RESUME_QUERYResult = []): ResumeItem[] {
  return items.flatMap((item) => {
    const type = resumeType(item.type);
    if (!type) return [];

    return {
      _id: item._id,
      type,
      institution: text(item.institution, "Untitled entry"),
      degree: text(item.degree),
      location: text(item.location),
      period: text(item.period),
      details: blocks(item.details),
      order: item.order ?? null,
    };
  });
}

export function normalizeHomeData({
  projects,
  skillCategories,
  resumeItems,
}: {
  projects?: PROJECTS_QUERYResult;
  skillCategories?: SKILLS_QUERYResult;
  resumeItems?: RESUME_QUERYResult;
}) {
  return {
    projects: normalizeProjects(projects),
    skillCategories: normalizeSkillCategories(skillCategories),
    resumeItems: normalizeResumeItems(resumeItems),
  };
}
