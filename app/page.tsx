// 首页页面：依赖的展示组件与 Sanity 客户端
import groq from "groq";
import { Navbar } from "@/components/layout";
import { Hero, AboutSection, ProjectsSection } from "@/components/sections";
import type { Project, SkillCategory, ResumeItem } from "@/types";
import { isSanityConfigured, sanityClient } from "@/lib/sanity";

// Incremental Static Regeneration: revalidate home page every 60s
export const revalidate = 60;

// 页面元数据：设置首页标题与描述（用于 SEO）
export const metadata = {
  title: "Home",
  description: "Welcome to Yuwei Li's portfolio - Explore my design and development projects.",
};

// GROQ 查询：从 Sanity 获取项目列表，按创建时间倒序
const PROJECTS_QUERY = groq`*[_type == "project"] | order(_createdAt desc){
  _id,
  title,
  summary,
  year,
  projectType,
  description,
  visibility,
  "slug": slug.current,
  "coverImage": coverImage{
    asset->{
      _ref,
      url
    },
    alt
  }
}`;

// GROQ 查询：从 Sanity 获取技能分类列表
const SKILLS_QUERY = groq`*[_type == "skillCategory"] | order(order asc){
  _id,
  title,
  order,
  skills
}`;

// GROQ 查询：从 Sanity 获取简历背景列表
const RESUME_QUERY = groq`*[_type == "education"] | order(order desc){
  _id,
  type,
  institution,
  degree,
  location,
  period,
  details,
  order
}`;

export default async function HomePage() {
  // 初始化数据
  let projects: Project[] = [];
  let skillCategories: SkillCategory[] = [];
  let resumeItems: ResumeItem[] = [];

  // 在 Sanity 配置完成时请求数据
  if (isSanityConfigured() && sanityClient) {
    try {
      const [projectsResult, skillsResult, resumeResult] = await Promise.all([
        sanityClient.fetch<Project[]>(PROJECTS_QUERY),
        sanityClient.fetch<SkillCategory[]>(SKILLS_QUERY),
        sanityClient.fetch<ResumeItem[]>(RESUME_QUERY)
      ]);
      if (projectsResult?.length) {
        projects = projectsResult;
      }
      if (skillsResult?.length) {
        skillCategories = skillsResult;
      }
      if (resumeResult?.length) {
        resumeItems = resumeResult;
      }
    } catch (error) {
      console.error("Failed to fetch data from Sanity", error);
    }
  }

  return (
    // 页面结构：导航栏 + Hero + About + Projects 列表
    <div className="min-h-screen" id="home">
      {/* 顶部导航，支持滚动隐藏 */}
      <Navbar />
      {/* 首页主视觉区 */}
      <Hero />
      {/* 关于我简介 */}
      <AboutSection skillCategories={skillCategories} resumeItems={resumeItems} />
      {/* 项目集合：从 CMS 获取的数据传入 */}
      <ProjectsSection projects={projects} />
    </div>
  );
}
