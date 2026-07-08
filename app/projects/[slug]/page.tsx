// 页面依赖：Next.js 组件、Sanity 客户端、PortableText 等
import { cache } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "next-view-transitions";

import { Navbar } from "@/components/layout";
import { ProjectGallery } from "@/components/projects";
import { JsonLd } from "@/components/seo/json-ld";
import { sanityClient } from "@/lib/sanity";
import { getExternalLinkProps, getSafeHref } from "@/lib/safe-url";
import { normalizeProjectDetail } from "@/lib/view-models/project";
import { PROJECT_QUERY, PROJECT_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { PROJECT_QUERYResult } from "@/sanity/sanity.types";
import type { ProjectDetail } from "@/types";
import { PortableText, type PortableTextReactComponents } from "@portabletext/react";

type Block = ProjectDetail["body"][number];

// Incremental Static Regeneration: revalidate project pages every 60s
export const revalidate = 60;
const SITE_URL = "https://www.yuweidesign.com";

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
    link: ({ children, value }) => {
      const href = getSafeHref((value as { href?: string })?.href);
      if (!href) return <>{children}</>;
      return (
        <a href={href} {...getExternalLinkProps(href)} className="underline underline-offset-4 transition-colors duration-base hover:text-design-dark-text-primary">
          {children}
        </a>
      );
    },
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
const renderBlocks = (blocks: Block[]) =>
  blocks.length ? <PortableText value={blocks} components={portableComponents} /> : null;

// 项目元信息行：与 About 区 Basic info / Capabilities 同款的行表语言
// （label / value 两栏、细分隔线、hover 时缩进 + 底色反馈），深浅分区各一套配色
const metaRowTones = {
  light: {
    row: "border-design-light-border sm:hover:bg-design-light-hover",
    label: "text-design-light-text-primary",
    value: "text-design-light-text-secondary",
  },
  dark: {
    row: "border-design-dark-border sm:hover:bg-design-dark-surface",
    label: "text-design-dark-text-primary",
    value: "text-design-dark-text-secondary",
  },
} as const;

function MetaRow({
  label,
  tone = "light",
  children,
}: {
  label: string;
  tone?: keyof typeof metaRowTones;
  children: React.ReactNode;
}) {
  const t = metaRowTones[tone];
  return (
    <div
      className={`grid grid-cols-1 gap-1 border-b px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 ${t.row}`}
    >
      <p className={`font-semibold ${t.label}`}>{label}</p>
      <div className={`text-small sm:text-body ${t.value}`}>{children}</div>
    </div>
  );
}

// 圆点分隔的行内列表：与 About 区 Languages / Capabilities 的技能列表同款
function DotList({ items, separatorClassName }: { items: string[]; separatorClassName: string }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1.5">
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-2">
          {i > 0 && <span className={separatorClassName}>·</span>}
          {item}
        </span>
      ))}
    </div>
  );
}

// 从 Sanity 获取项目数据
// 用 React cache() 去重：generateMetadata 与页面组件共用同一次请求
const fetchProject = cache(async (rawSlug?: string): Promise<ProjectDetail | null> => {
  // 1. 数据清洗：确保 slug 存在并去除两端的空格，防止无效的查询请求
  const slug = rawSlug?.toString().trim();

  // 2. 卫语句 (Guard Clause)：如果 slug 为空，直接返回 null，不进行后续昂贵的网络请求
  if (!slug) return null;

  // 3. 发起请求：查询结果类型由 TypeGen 自动推导（见 sanity/sanity.types.ts）
  try {
    const result: PROJECT_QUERYResult = await sanityClient.fetch(PROJECT_QUERY, { slug });
    return normalizeProjectDetail(result, slug);
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
  const projectTitle = project.title || "Project";
  const projectUrl = `${SITE_URL}/projects/${project.slug}`;
  return {
    title: `${projectTitle} | Yuwei Li`,
    description: project.summary ?? undefined,
    alternates: {
      canonical: projectUrl,
    },
    openGraph: {
      type: "article",
      url: projectUrl,
      title: `${projectTitle} | Yuwei Li`,
      description: project.summary ?? undefined,
      images: project.coverImage
        ? [
            {
              url: `${project.coverImage.url}?w=1200&h=630&fit=crop&auto=format`,
              width: 1200,
              height: 630,
              alt: projectTitle,
            },
          ]
        : undefined,
    },
  };
}

// 页面组件：根据动态路由 `slug` 查询并渲染项目详情
export default async function ProjectPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params;
  const project = await fetchProject(slug);

  // 查无项目：返回真正的 404 状态码，避免死链被搜索引擎当作正常页面收录
  if (!project) notFound();

  const projectTitle = project.title || "Project";
  const projectUrl = `${SITE_URL}/projects/${project.slug}`;
  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: projectTitle,
    description: project.summary || undefined,
    url: projectUrl,
    image: project.coverImage?.url,
    creator: {
      "@type": "Person",
      name: "Yuwei Li",
      url: SITE_URL,
    },
    dateCreated: project.year ? String(project.year) : undefined,
    keywords: project.tags?.length ? project.tags.join(", ") : undefined,
  };

  return (
    // 顶部浅色信息区 + 底部深色详情区
    <div className="relative min-h-screen text-design-light-text-primary">
      {/* 固定导航栏：支持向下滚动时收起（见 Navbar 实现）*/}
      <JsonLd data={projectJsonLd} />
      <Navbar />
      {/* 背景装饰层：不阻塞交互（pointer-events-none），固定在视窗，降低层级 */}
      {/* Background like home */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" />
        <Image
          src="/hero_mg.svg"
          alt=""
          fill
          sizes="100vw"
          className="select-none object-contain object-[50%_10%] opacity-50 blur-md"
        />
      </div>

      {/* 顶部留白加大：给 fixed 导航浮层（logo / Menu 按钮）让出空间 */}
      <main className="w-full bg-design-light-bg px-container pb-section pt-24 sm:px-container-sm sm:pb-section-sm sm:pt-28">
        <div className="mx-auto max-w-6xl flex flex-col gap-12">
          {/* 顶部浅色信息区 */}
          <section className="flex flex-col gap-6">
            {/* 返回链接：回到项目列表 */}
            <Link href="/#work" className="text-small font-medium text-design-light-text-secondary transition-colors duration-base hover:text-design-light-text-primary">
              ← Back to projects
            </Link>

            {/* 标题块：与 hero / About 同款的「小标签 + 大标题」排版时刻 */}
            <div className="space-y-5">
              <p className="text-label font-semibold uppercase text-design-light-text-muted">Project</p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-design-light-text-primary sm:text-5xl lg:text-6xl">
                {project.title}
              </h1>
            </div>

            {/* 项目摘要：细分隔线 + 大号次级文字（呼应 hero 的描述行） */}
            {project.summary && (
              <div className="border-t border-design-light-border pt-6">
                <p className="max-w-4xl text-pretty text-lg leading-relaxed text-design-light-text-secondary sm:text-xl">
                  {project.summary}
                </p>
              </div>
            )}

            {/* 封面大图：放在首屏（从项目卡片点进来第一眼就能看到），priority 优化 LCP */}
            {project.coverImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-media">
                <Image
                  src={project.coverImage.url}
                  alt={project.coverImage.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 1152px, 100vw"
                />
              </div>
            )}

            {/* 元信息行表：类型/年份/地点/客户/贡献者，与 About 区 Basic info 同款 */}
            <div className="border-t border-design-light-border">
              {project.projectType && <MetaRow label="Type">{project.projectType}</MetaRow>}
              {project.year && <MetaRow label="Year">{project.year}</MetaRow>}
              {project.location && <MetaRow label="Location">{project.location}</MetaRow>}
              {project.client && <MetaRow label="Client">{project.client}</MetaRow>}
              {project.contributors.length ? (
                <MetaRow label="Contributors">
                  <DotList items={project.contributors} separatorClassName="text-design-light-border" />
                </MetaRow>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      {/* 底部深色详情区：封面、富文本详情、我的贡献、外链、图片画廊
          data-overscroll-dark：区块在视口内时 body 背景切深色（见 OverscrollBackground） */}
      <section data-overscroll-dark className="w-full bg-design-dark-bg px-container py-section text-design-dark-text-primary sm:px-container-sm sm:py-section-sm scroll-mt-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          {project.body.length ? (
            // 项目详情（富文本）：深色区以项目故事开场，不加顶部分割线；标题由编辑者在富文本中自行书写
            <section>
              <div className="text-design-dark-text-secondary">{renderBlocks(project.body)}</div>
            </section>
          ) : null}

          {/* My Contribution：关于"我"的一组——角色/技能行表 + 贡献描述，
              与浅色区的项目 metadata 表明确分组（那边是项目信息，这边是个人信息） */}
          {project.role.length || project.tags.length || project.myContribution.length ? (
            <section className="border-t border-design-dark-border-strong pt-10">
              <h2 className="text-2xl font-semibold leading-tight text-design-dark-text-primary sm:text-3xl">My Contribution</h2>
              {project.role.length || project.tags.length ? (
                <div className="mt-6 border-t border-design-dark-border">
                  {project.role.length ? (
                    <MetaRow label="Roles" tone="dark">
                      <DotList items={project.role} separatorClassName="text-design-dark-border-strong" />
                    </MetaRow>
                  ) : null}
                  {project.tags.length ? (
                    <MetaRow label="Skills" tone="dark">
                      <DotList items={project.tags} separatorClassName="text-design-dark-border-strong" />
                    </MetaRow>
                  ) : null}
                </div>
              ) : null}
              {project.myContribution.length ? (
                <div className="mt-6 text-design-dark-text-secondary">{renderBlocks(project.myContribution)}</div>
              ) : null}
            </section>
          ) : null}

          {project.links.length ? (
            // 相关链接：优先显示 label；无 label 时显示 URL
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-design-dark-text-primary">Links</h2>
              <ul className="space-y-2 text-small text-design-dark-text-secondary">
                {project.links.map((link) => {
                  const href = link.href;
                  return (
                    <li key={link.key}>
                      {href ? (
                        <a href={href} {...getExternalLinkProps(href)} className="text-design-dark-text-secondary underline underline-offset-4 transition-colors duration-base hover:text-design-dark-text-primary">
                          {link.label}
                        </a>
                      ) : (
                        <span>{link.label || link.originalUrl}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
        {project.gallery.length ? (
          // 图片画廊：Masonry 瀑布流缩略图，点击进入 lightbox（缩放、拖拽、移动端手势）
          <div className="mt-32 -mx-4 sm:-mx-6 px-4 sm:px-10">
            <ProjectGallery items={project.gallery} fullWidth />
          </div>
        ) : null}
      </section>
    </div>
  );
}
