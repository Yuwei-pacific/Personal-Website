import type { Project, ResumeItem, SkillCategory } from "./types";
import type {
  HOME_WORK_QUERY_RESULT,
  RESUME_QUERY_RESULT,
  SKILLS_QUERY_RESULT,
} from "@/sanity/sanity.types";
import { isAnimatedImage } from "@/lib/media";
import { blocks, optionalText, stringList, text, video } from "./utils";

const resumeType = (value: RESUME_QUERY_RESULT[number]["type"]): ResumeItem["type"] | null =>
  value === "education" || value === "experience" ? value : null;

// 精选与目录用同一份投影（PROJECT_LIST_PROJECTION）
type RawProjectListItem = HOME_WORK_QUERY_RESULT["featured"][number] | HOME_WORK_QUERY_RESULT["index"][number];

function normalizeProjects(items: RawProjectListItem[] = []): Project[] {
  return items.map((item) => {
    const title = text(item.title, "Untitled project");
    return {
      _id: item._id,
      title,
      summary: text(item.summary),
      year: item.year ?? null,
      projectType: optionalText(item.projectType),
      roles: stringList(item.roles),
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

/** 首页 Work 区：精选与目录两组，拆分与排序都已在 HOME_WORK_QUERY 里完成 */
export function normalizeHomeWork(raw: HOME_WORK_QUERY_RESULT | null | undefined): {
  featured: Project[];
  index: Project[];
} {
  return {
    featured: normalizeProjects(raw?.featured ?? []),
    index: normalizeProjects(raw?.index ?? []),
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
