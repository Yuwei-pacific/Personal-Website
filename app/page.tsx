// 首页页面：依赖的展示组件与 Sanity 客户端
import { Navbar } from "@/components/layout/navbar";
import { AboutSection } from "@/components/sections/about-section";
import { Hero } from "@/components/sections/hero";
import { ProjectsSection } from "@/components/sections/projects-section";
import { JsonLd, personSchema } from "@/components/seo/json-ld";
import { sanityClient } from "@/lib/sanity";
import { normalizeHomeData } from "@/lib/view-models/home";
import { PROJECTS_QUERY, SKILLS_QUERY, RESUME_QUERY } from "@/sanity/lib/queries";
import type {
  PROJECTS_QUERYResult,
  RESUME_QUERYResult,
  SKILLS_QUERYResult,
} from "@/sanity/sanity.types";

// Incremental Static Regeneration: revalidate home page every 60s
export const revalidate = 60;

// 页面元数据：设置首页标题与描述（用于 SEO）
export const metadata = {
  title: "Home",
  description: "Welcome to Yuwei Li's portfolio - Explore my design and development projects.",
};

export default async function HomePage() {
  // 过滤与排序都在 GROQ 里完成（见 sanity/lib/queries.ts），这里只兜底请求失败
  let projects: PROJECTS_QUERYResult = [];
  let skillCategories: SKILLS_QUERYResult = [];
  let resumeItems: RESUME_QUERYResult = [];

  try {
    [projects, skillCategories, resumeItems] = await Promise.all([
      sanityClient.fetch(PROJECTS_QUERY),
      sanityClient.fetch(SKILLS_QUERY),
      sanityClient.fetch(RESUME_QUERY),
    ]);
  } catch (error) {
    console.error("Failed to fetch data from Sanity", error);
  }

  const homeData = normalizeHomeData({ projects, skillCategories, resumeItems });

  return (
    // 页面结构：导航栏 + Hero + About + Projects 列表
    <div className="min-h-screen">
      {/* Person 结构化数据：增强 E-E-A-T 信号 */}
      <JsonLd data={personSchema} />
      {/* 顶部导航，支持滚动隐藏 */}
      <Navbar />
      {/* 首页主视觉区 */}
      <Hero />
      {/* 关于我简介 */}
      <AboutSection skillCategories={homeData.skillCategories} resumeItems={homeData.resumeItems} />

      {/* 项目集合：从 CMS 获取的数据传入 */}
      <ProjectsSection projects={homeData.projects} />
    </div>
  );
}
