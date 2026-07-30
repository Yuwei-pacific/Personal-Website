import type { Project, ResumeItem, SkillCategory } from "./types";
import type {
  PROJECTS_QUERY_RESULT,
  RESUME_QUERY_RESULT,
  SKILLS_QUERY_RESULT,
} from "@/sanity/sanity.types";
import { isAnimatedImage } from "@/lib/media";
import { blocks, optionalText, stringList, text, video } from "./utils";

const resumeType = (value: RESUME_QUERY_RESULT[number]["type"]): ResumeItem["type"] | null =>
  value === "education" || value === "experience" ? value : null;

function normalizeProjects(items: PROJECTS_QUERY_RESULT = []): Project[] {
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
            animated: isAnimatedImage(item.coverImage.asset.mimeType),
          }
        : null,
      coverVideo: video(item.coverVideo),
    };
  });
}

function normalizeSkillCategories(items: SKILLS_QUERY_RESULT = []): SkillCategory[] {
  return items.map((item) => ({
    _id: item._id,
    title: text(item.title, "Untitled category"),
    order: item.order ?? null,
    skills: stringList(item.skills),
  }));
}

function normalizeResumeItems(items: RESUME_QUERY_RESULT = []): ResumeItem[] {
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
  projects?: PROJECTS_QUERY_RESULT;
  skillCategories?: SKILLS_QUERY_RESULT;
  resumeItems?: RESUME_QUERY_RESULT;
}) {
  return {
    projects: normalizeProjects(projects),
    skillCategories: normalizeSkillCategories(skillCategories),
    resumeItems: normalizeResumeItems(resumeItems),
  };
}

export function normalizeAboutData({
  skillCategories,
  resumeItems,
}: {
  skillCategories?: SKILLS_QUERY_RESULT;
  resumeItems?: RESUME_QUERY_RESULT;
}) {
  return {
    skillCategories: normalizeSkillCategories(skillCategories),
    resumeItems: normalizeResumeItems(resumeItems),
  };
}
