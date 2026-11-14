// 项目列表区：展示从 CMS 获取的项目卡片
import { ProjectCard } from "@/components/projects/project-card";
import { MaskedSectionHeading } from "@/components/ui/masked-section-heading";
import type { Project } from "@/lib/view-models/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type ProjectsSectionProps = {
  projects: Project[];
  locale: Locale;
  dictionary: Dictionary;
};

export function ProjectsSection({ projects, locale, dictionary }: ProjectsSectionProps) {
  // 可见性过滤与年份排序都在 GROQ 里完成（见 sanity/queries.ts），这里直接渲染
  const hasProjects = projects.length > 0;

  return (
    // 外层区块：带滚动定位锚点 "work"。底色由外层的表面（surface-*）决定
    <section
      id="work"
      className="w-full bg-design-dark-bg text-design-dark-text-primary relative z-10 scroll-mt-24"
    >
      {/* 深浅分界处两块直接相接，这里的上下留白属于深色区块自身的内边距（panel 档），
          而不是 section 之间的呼吸 —— 用 section 档会在分界线下方留出过大的空档 */}
      <div className="flex w-full flex-col gap-6 py-panel sm:gap-gap-section sm:py-panel-sm">
        {/* 全宽标题：复用 Hero / 导航的遮罩滑入动画，左边缘与项目网格对齐 */}
        <MaskedSectionHeading
          title={dictionary.home.projects.title}
          count={projects.length}
          countAriaLabel={`${projects.length} ${dictionary.home.projects.countLabel}`}
        />

        {!hasProjects ? (
          /* 空状态提示：CMS 未发布时的占位 */
          <div className="mx-auto mt-2 w-full max-w-content border border-dashed border-design-dark-border bg-design-dark-surface/60 p-card text-small text-design-dark-text-secondary">
            {dictionary.home.projects.empty}
          </div>
        ) : (
          /* 项目列表：拼贴式项目墙，按行编排的宽度与错位节奏见 project-card.tsx 的 planLayout */
          <div className="mt-4 grid w-full grid-cols-1 gap-x-3 gap-y-14 px-edge sm:gap-x-4 sm:gap-y-20 sm:px-edge-sm md:grid-cols-12">
            {projects.map((project, idx) => (
              <ProjectCard
                key={project._id}
                project={project}
                slug={project.slug ?? undefined}
                revealDelay={idx === 0 ? 0 : 0.1}
                index={idx}
                total={projects.length}
                locale={locale}
                dictionary={dictionary}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
