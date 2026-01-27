// 首页页面：依赖的展示组件与 Sanity 客户端
import groq from "groq";
import { AboutSection } from "@/components/sections/about-section";
import { Hero } from "@/components/sections/hero";
import { Navbar } from "@/components/layout/navbar";
import { ProjectsSection } from "@/components/sections/projects-section";
import type { Project } from "@/components/projects/types";
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

export default async function HomePage() {
  // 初始化项目数据；默认空列表，避免渲染时报错
  let projects: Project[] = [];

  // 在 Sanity 配置完成时请求项目数据
  if (isSanityConfigured() && sanityClient) {
    try {
      // fetch 返回项目数组；有数据则赋值给 projects
      const result = await sanityClient.fetch<Project[]>(PROJECTS_QUERY);
      if (result?.length) {
        projects = result;
      }
    } catch (error) {
      // 捕获错误以便在开发环境中调试
      console.error("Failed to fetch projects from Sanity", error);
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
      <AboutSection />
      {/* 项目集合：从 CMS 获取的数据传入 */}
      <ProjectsSection projects={projects} />
    </div>
  );
}
