// 页面依赖：Next.js 组件、Sanity 客户端、PortableText 等
import { cache } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "next-view-transitions";

import { Navbar } from "@/components/layout";
import { ProjectGallery } from "@/components/projects";
import { sanityClient } from "@/lib/sanity";
import { PROJECT_QUERY, PROJECT_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { PROJECT_QUERYResult } from "@/sanity/sanity.types";
import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

// 项目详情类型：直接来自 TypeGen 生成的查询结果类型
type ProjectDetail = NonNullable<PROJECT_QUERYResult>;
type Block = NonNullable<ProjectDetail["body"]>[number];

// Incremental Static Regeneration: revalidate project pages every 60s
export const revalidate = 60;

// PortableText 组件配置：定义富文本内容的渲染方式
// 各级块元素自带上边距（first:mt-0 抵消首个元素），让标题与正文之间有明显的呼吸感
const portableComponents: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => (
      <h3 className="mt-14 text-2xl font-semibold leading-tight text-design-dark-text-primary first:mt-0 sm:text-3xl">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mt-10 text-xl font-semibold leading-tight text-design-dark-text-primary first:mt-0 sm:text-2xl">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mt-5 whitespace-pre-line text-base leading-relaxed first:mt-0 sm:text-lg sm:leading-8">
        {children}
      </p>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-design-dark-text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => (
      <a href={(value as { href?: string })?.href} className="underline underline-offset-4 transition-colors duration-base hover:text-design-dark-text-primary">
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-3 pl-6 text-base leading-relaxed first:mt-0 sm:text-lg sm:leading-8">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-3 pl-6 text-base leading-relaxed first:mt-0 sm:text-lg sm:leading-8">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
};

// 辅助函数：渲染富文本块
const renderBlocks = (blocks?: Block[] | null) =>
  blocks?.length ? <PortableText value={blocks as PortableTextBlock[]} components={portableComponents} /> : null;

// 从 Sanity 获取项目数据
// 用 React cache() 去重：generateMetadata 与页面组件共用同一次请求
const fetchProject = cache(async (rawSlug?: string): Promise<ProjectDetail | null> => {
  // 1. 数据清洗：确保 slug 存在并去除两端的空格，防止无效的查询请求
  const slug = rawSlug?.toString().trim();

  // 2. 卫语句 (Guard Clause)：如果 slug 为空，直接返回 null，不进行后续昂贵的网络请求
  if (!slug) return null;

  // 3. 发起请求：查询结果类型由 TypeGen 自动推导（见 sanity/sanity.types.ts）
  try {
    return await sanityClient.fetch(PROJECT_QUERY, { slug });
  } catch (error) {
    console.error("Failed to fetch project from Sanity", error);
    return null;
  }
});

// 构建时预生成所有可见项目的静态页面
export async function generateStaticParams() {
  try {
    const slugs = await sanityClient.fetch(PROJECT_SLUGS_QUERY);
    return slugs.filter((slug): slug is string => Boolean(slug)).map((slug) => ({ slug }));
  } catch {
    return [];
  }
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
  return { title: `${project.title} | Yuwei Li`, description: project.summary ?? undefined };
}

// 页面组件：根据动态路由 `slug` 查询并渲染项目详情
export default async function ProjectPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params;
  const project = await fetchProject(slug);

  // 查无项目：返回真正的 404 状态码，避免死链被搜索引擎当作正常页面收录
  if (!project) notFound();

  return (
    // 顶部浅色信息区 + 底部深色详情区
    <div className="relative min-h-screen text-design-light-text-primary">
      {/* 固定导航栏：支持向下滚动时收起（见 Navbar 实现）*/}
      <Navbar />
      {/* 背景装饰层：不阻塞交互（pointer-events-none），固定在视窗，降低层级 */}
      {/* Background like home */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" />
        <Image
          src="/hero_mg.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="select-none object-contain object-[50%_10%] opacity-50 blur-md"
        />
      </div>

      {/* 顶部留白加大：给 fixed 导航浮层（logo / Menu 按钮）让出空间 */}
      <main className="w-full bg-design-light-bg px-container pb-section pt-24 sm:px-container-sm sm:pb-section-sm sm:pt-28">
        <div className="mx-auto max-w-6xl flex flex-col gap-12">
          {/* 顶部浅色信息区 */}
          <section className="flex flex-col gap-4">
            {/* 返回链接：回到项目列表 */}
            <Link href="/#work" className="text-small font-medium text-design-light-text-secondary transition-colors duration-base hover:text-design-light-text-primary">
              ← Back to projects
            </Link>

            <>
              {/* 头部标签：项目类型/年份/地点/客户等元信息 */}
                <p className="text-label font-semibold uppercase text-design-light-text-muted">Project</p>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold sm:text-section">{project.title}</h1>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-design-light-text-primary">
                      {project.projectType && (
                        <span className="rounded-tag border border-design-light-border bg-design-light-active px-3 py-1">
                          Project type: {project.projectType}
                        </span>
                      )}
                      {project.year && (
                        <span className="rounded-tag border border-design-light-border bg-design-light-active px-3 py-1">
                          Year: {project.year}
                        </span>
                      )}
                      {project.location && (
                        <span className="rounded-tag border border-design-light-border bg-design-light-active px-3 py-1">
                          Location: {project.location}
                        </span>
                      )}
                      {project.client && (
                        <span className="rounded-tag border border-design-light-border bg-design-light-active px-3 py-1">
                          {project.client}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 项目摘要 */}
                  <p className="text-lg leading-7 text-design-light-text-secondary">{project.summary}</p>
                </div>


                {/* 贡献者：单独一行列出 */}
                {project.contributors?.length ? (
                  <div className="space-y-2 border-t border-design-light-border pt-3">
                    <p className="text-label font-semibold uppercase text-design-light-text-muted">Contributors</p>
                    <div className="flex flex-wrap gap-2">
                      {project.contributors.map((c: string) => (
                        <span key={c} className="rounded-tag border border-design-light-border bg-design-light-active px-3 py-1 text-xs font-medium text-design-light-text-primary">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
            </>
          </section>
        </div>
      </main>

      {/* 底部深色详情区：封面、富文本详情、我的贡献、外链、图片画廊
          data-overscroll-dark：区块在视口内时 body 背景切深色（见 OverscrollBackground） */}
      {project && (
        <section data-overscroll-dark className="w-full bg-design-dark-bg px-container py-section text-design-dark-text-primary sm:px-container-sm sm:py-section-sm scroll-mt-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            {project.coverImage?.url && (
              // 封面图：使用 next/image 获得自动响应式与懒加载
              <div className="relative aspect-video w-full overflow-hidden rounded-media">
                <Image
                  src={project.coverImage.url}
                  alt={project.title || "Project Cover"}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 1152px, 100vw"
                />
              </div>
            )}

            {/* 角色：单独一行列出 */}
            {project.role?.length ? (
              <div className="space-y-2 border-t border-design-dark-border-strong pt-3">
                <p className="text-label font-semibold uppercase text-design-dark-text-muted">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {project.role.map((r: string) => (
                    <span key={r} className="rounded-tag border border-design-dark-text-muted px-3 py-1 text-small font-medium text-design-dark-text-muted">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 技能标签：单独一行列出 */}
            {project.tags?.length ? (
              <div className="space-y-2">
                <p className="text-label font-semibold uppercase text-design-dark-text-muted">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag: string) => (
                    <span key={tag} className="rounded-tag border border-design-dark-text-muted px-3 py-1 text-small font-medium text-design-dark-text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {project.body?.length ? (
              // 项目详情（富文本）：标题由编辑者在富文本中自行书写；块间距由 portableComponents 内部管理
              <section className="border-t border-design-dark-border-strong pt-10">
                <div className="text-design-dark-text-secondary">{renderBlocks(project.body)}</div>
              </section>
            ) : null}



            {project.myContribution?.length ? (
              // 我的贡献（富文本）：与详情同样的渲染配置与阅读行宽
              <section className="border-t border-design-dark-border-strong pt-10">
                <h2 className="text-2xl font-semibold leading-tight text-design-dark-text-primary sm:text-3xl">My Contribution</h2>
                <div className="mt-6 text-design-dark-text-secondary">{renderBlocks(project.myContribution)}</div>
              </section>
            ) : null}

            {project.links?.length ? (
              // 相关链接：优先显示 label；无 label 时显示 URL
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-design-dark-text-primary">Links</h2>
                <ul className="space-y-2 text-small text-design-dark-text-secondary">
                  {project.links.map((link: { label?: string; url?: string }, idx: number) => (
                    <li key={idx}>
                      {link.url ? (
                        <a href={link.url} className="text-design-dark-text-secondary underline underline-offset-4 transition-colors duration-base hover:text-design-dark-text-primary">
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
            <div className="mt-32 -mx-4 sm:-mx-6 px-4 sm:px-10">
              <ProjectGallery items={project.gallery} columns="3" fullWidth />
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
