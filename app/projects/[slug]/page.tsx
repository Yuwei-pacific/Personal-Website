// 页面依赖：Next.js 组件、Sanity 客户端、PortableText 等
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import groq from "groq";

import { Navbar } from "@/components/layout/navbar";
import { ProjectGallery } from "@/components/projects/project-gallery";
import type { Project } from "@/components/projects/types";
import { isSanityConfigured, sanityClient } from "@/lib/sanity";
import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

// PortableText 块类型定义
type Block = PortableTextBlock & {
  _type: string; // 确保 _type 不为 undefined
  children?: Array<{ text?: string }>;
};

// 项目详情页面的类型定义，扩展自基础 Project 类型
type ProjectDetail = Project & {
  role?: string[]; // 职责列表
  tags?: string[]; // 标签列表
  client?: string; // 客户名称
  location?: string; // 项目地点
  links?: { label?: string; url?: string }[]; // 相关链接
  coverImage?: { url?: string }; // 封面图
  gallery?: { url?: string; alt?: string; caption?: string; width?: number; height?: number }[]; // 图片画廊
  body?: Block[]; // 项目详情内容（富文本）
  myContribution?: Block[]; // 我的贡献内容（富文本）
};

// GROQ 查询：从 Sanity 获取项目详情数据
const PROJECT_QUERY = groq`*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  summary,
  role,
  tags,
  description,
  "slug": slug.current,
  year,
  projectType,
  client,
  location,
  links,
  "coverImage": { "url": coalesce(coverImage.asset->url, "") },
  "gallery": gallery[]{
    "url": coalesce(image.asset->url, ""),
    alt,
    caption,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height
  },
  body,
  myContribution
}`;

// PortableText 组件配置：定义富文本内容的渲染方式
const portableComponents: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => <h3 className="text-xl font-semibold leading-tight">{children}</h3>,
    h3: ({ children }) => <h4 className="text-lg font-semibold leading-tight">{children}</h4>,
    normal: ({ children }) => <p className="text-base leading-7 whitespace-pre-line">{children}</p>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => (
      <a href={(value as { href?: string })?.href} className="underline underline-offset-4 hover:text-emerald-400">
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-base leading-7">{children}</li>,
    number: ({ children }) => <li className="text-base leading-7">{children}</li>,
  },
};

// 辅助函数：渲染富文本块
const renderBlocks = (blocks?: Block[]) =>
  blocks?.length ? <PortableText value={blocks as PortableTextBlock[]} components={portableComponents} /> : null;

// 从 Sanity 获取项目数据
async function fetchProject(rawSlug?: string): Promise<ProjectDetail | null> {
  // 1. 数据清洗：确保 slug 存在并去除两端的空格，防止无效的查询请求
  const slug = rawSlug?.toString().trim();

  // 2. 卫语句 (Guard Clause)：如果 slug 为空，直接返回 null，不进行后续昂贵的网络请求
  if (!slug) return null;

  // 3. 环境检查：确保 Sanity 的配置项（如 Project ID）已正确设置，且客户端实例已初始化
  if (isSanityConfigured() && sanityClient) {
    try {
      // 4. 发起网络请求：
      // - 使用 sanityClient.fetch 方法
      // - 传入事先定义好的 GROQ 查询语句 (PROJECT_QUERY)
      // - 传入参数对象 { slug }，Sanity 会将其替换查询语句中的 $slug 变量
      // - <ProjectDetail | null> 是 TS 泛型，告诉程序返回的数据符合什么结构
      const project = await sanityClient.fetch<ProjectDetail | null>(PROJECT_QUERY, { slug });

      // 5. 如果查到了项目数据，将其返回
      if (project) return project;
    } catch (error) {
      // 实际开发中通常会在这里添加错误日志，例如 console.error("Fetch error:", error);
      return null;
    }
  }

  // 6. 兜底策略：如果以上条件均不满足（如 CMS 未连接或查无此项），统一返回 null
  return null;
}

// 生成页面元数据（用于 SEO）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) return { title: "Project Not Found | Yuwei Li" };
  return { title: `${project.title} | Yuwei Li`, description: project.summary || project.description };
}

// 页面组件：根据动态路由 `slug` 查询并渲染项目详情
export default async function ProjectPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params;
  const project = await fetchProject(slug);

  return (
    // 顶部浅色信息区 + 底部深色详情区
    <div className="relative min-h-screen text-neutral-900">
      {/* 固定导航栏：支持向下滚动时收起（见 Navbar 实现）*/}
      <Navbar />
      {/* 背景装饰层：不阻塞交互（pointer-events-none），固定在视窗，降低层级 */}
      {/* Background like home */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" />
        <Image
          src="/hero_mg.svg"
          alt="Hero background graphic"
          fill
          priority
          sizes="100vw"
          className="select-none object-contain object-[50%_10%] opacity-50 blur-md"
        />
      </div>

      <main className="mx-auto flex w-full max-w-9xl bg-neutral-100 flex-col gap-12 px-4 py-12 sm:px-40 sm:py-16">
        {/* 顶部浅色信息区 */}
        <section className="flex flex-col gap-4">
          {/* 返回链接：回到项目列表 */}
          <Link href="/" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
            ← Back to projects
          </Link>

          {project ? (
            <>
              {/* 头部标签：项目类型/年份/地点/客户等元信息 */}
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Project</p>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold sm:text-4xl">{project.title}</h1>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-neutral-800">
                    {project.projectType && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        {project.projectType}
                      </span>
                    )}
                    {project.year && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        Year: {project.year}
                      </span>
                    )}
                    {project.location && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        Location: {project.location}
                      </span>
                    )}
                    {project.client && (
                      <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1">
                        Client: {project.client}
                      </span>
                    )}
                  </div>
                </div>
                {/* 项目摘要：优先使用 summary，无则回退到 description */}
                <p className="text-lg leading-7 text-neutral-700">{project.summary || project.description}</p>
              </div>

              {/* 角色与标签：按需渲染为胶囊样式的集合 */}
              {(project.role?.length || project.tags?.length) && (
                <div className="flex flex-wrap gap-2 text-xs text-neutral-700">
                  {project.role?.map((r: string) => (
                    <span key={r} className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 font-medium">
                      {r}
                    </span>
                  ))}
                  {project.tags?.map((tag: string) => (
                    <span key={tag} className="rounded-full border border-neutral-200 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            // 查无项目：友好的兜底提示与引导
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold text-neutral-900">Project not found</h1>
              <p className="text-sm text-neutral-700">
                We couldn&apos;t find this project. Try another link or check your Sanity content.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* 底部深色详情区：封面、富文本详情、我的贡献、外链、图片画廊 */}
      {project && (
        <section className="w-full bg-neutral-950 px-4 pb-16 pt-16 text-white sm:px-6 sm:pb-20 sm:pt-20 scroll-mt-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            {project.coverImage?.url && (
              // 封面图：非 Next/Image，直接使用原始 URL，懒加载
              <div className="overflow-hidden">
                <img
                  src={project.coverImage.url}
                  alt={project.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {project.body?.length ? (
              // 项目详情（富文本）：通过 PortableText 渲染，支持标题、列表、加粗、链接等
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Details</h2>
                <div className="space-y-3 text-neutral-400">{renderBlocks(project.body)}</div>
              </section>
            ) : null}

            {project.myContribution?.length ? (
              // 我的贡献（富文本）：与详情同样的渲染配置
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">My Contribution</h2>
                <div className="space-y-3 text-neutral-400">{renderBlocks(project.myContribution)}</div>
              </section>
            ) : null}

            {project.links?.length ? (
              // 相关链接：优先显示 label；无 label 时显示 URL
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Links</h2>
                <ul className="space-y-2 text-sm text-neutral-200">
                  {project.links.map((link: { label?: string; url?: string }, idx: number) => (
                    <li key={idx}>
                      {link.url ? (
                        <a href={link.url} className="text-emerald-300 underline hover:text-emerald-200">
                          {link.label || link.url}
                        </a>
                      ) : (
                        <span>{link.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          {project.gallery?.length ? (
            // 图片画廊：支持缩放、拖拽、移动端手势；`columns` 控制列数，`fullWidth` 充满容器
            <div className="mt-32">
              <ProjectGallery items={project.gallery} columns="3" fullWidth />
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

