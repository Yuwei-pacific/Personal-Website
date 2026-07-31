import Image from "next/image";
import type { ResumeItem, SkillCategory } from "@/lib/view-models/types";
import { ResumeList } from "./resume-list";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { StaggerReveal } from "@/components/ui/stagger-reveal";
import { RevealText } from "@/components/ui/reveal-text";
import { Parallax } from "@/components/ui/parallax";
import { SkillsMarquee } from "@/components/ui/skills-marquee";

type AboutPageContentProps = {
  skillCategories?: SkillCategory[];
  resumeItems?: ResumeItem[];
};

export function AboutPageContent({ skillCategories, resumeItems }: AboutPageContentProps) {
  // 分离 Education 和 Experience 数据
  const educations = resumeItems?.filter(item => item.type === 'education') || [];
  const experiences = resumeItems?.filter(item => item.type === 'experience') || [];

  // 内容来源只有 CMS：无数据时显示空状态，不再回退到仓库里的副本
  const categoriesToRender = skillCategories ?? [];
  return (
    <main id="main-content" className="relative z-10 min-h-screen w-full bg-background">
      <div className="mx-auto flex max-w-content flex-col gap-gap-section px-container pb-7 pt-28 sm:gap-gap-section-sm sm:px-container-sm sm:pb-12 sm:pt-36">
        {/* Intro: 大字逐词点亮的自我介绍，人像与文字左右排版 */}
        <div className="flex flex-col gap-10">
          {/* Edwin Le style layout - Image absolutely positioned on the right, overlapping the text on the left */}
          <div className="relative pb-8 sm:pb-0">
            {/* Portrait on the right side — outer div owns position, inner Parallax
              owns the transform (drifts upward on scroll) so they don't conflict */}
            <div className="pointer-events-none absolute right-0 top-1/2 w-[45%] max-w-[240px] -translate-y-1/2 sm:w-[35%] sm:max-w-[320px] lg:w-[30%] lg:max-w-[360px]">
              <Parallax offset={-160}>
                {/* 抠像人像直接落在页面白底上：不加卡片底色与阴影 */}
                <div className="group relative aspect-square overflow-hidden">
                  <Image
                    id="about-page-portrait-mask"
                    src="/Profile_Yuwei.webp"
                    alt="Portrait of Yuwei Li"
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 240px"
                    className="object-cover object-top transition-transform duration-media ease-design-out group-hover:scale-emphasis"
                  />
                  {/* Sleek overlay hover effect */}
                  <div className="absolute inset-0 bg-design-light-accent/5 opacity-0 transition-opacity duration-slow group-hover:opacity-100 pointer-events-none" />
                </div>
              </Parallax>
            </div>

            {/* Text on top — the portrait alpha mask supplies the cross-image contrast */}
            <div className="relative z-10 pr-[30%] sm:pr-[24%] lg:pr-[20%]">
              <p className="text-label font-semibold uppercase text-design-light-text-muted">
                About me
              </p>
              <RevealText
                as="h1"
                text="I connect communication design and frontend development to turn ideas into clear, expressive, and maintainable digital experiences."
                maskTargetId="about-page-portrait-mask"
                maskImageSrc="/Profile_Yuwei_mask.webp"
                className="mt-4 text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
              />
            </div>
          </div>


          {/* Basic info — same row-table style as Education / Experience / Capabilities */}
          <ScrollReveal>
            <div className="border-t border-design-light-border">
              <div className="grid grid-cols-1 gap-1 border-b border-design-light-border px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-design-light-hover">
                <p className="font-semibold text-design-light-text-primary">Role</p>
                <p className="text-small text-design-light-text-secondary sm:text-body">Communication Designer &amp; Frontend Developer</p>
              </div>
              <div className="grid grid-cols-1 gap-1 border-b border-design-light-border px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-design-light-hover">
                <p className="font-semibold text-design-light-text-primary">Location</p>
                <p className="text-small text-design-light-text-secondary sm:text-body">Milan, Italy</p>
              </div>
              <div className="grid grid-cols-1 gap-1 border-b border-design-light-border px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-design-light-hover">
                <p className="font-semibold text-design-light-text-primary">Languages</p>
                <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-small text-design-light-text-secondary sm:text-body">
                  {["Chinese — Native", "English — B2", "Italiano — B2"].map((lang, i) => (
                    <span key={lang} className="flex items-center gap-2">
                      {i > 0 && <span className="text-design-light-border">·</span>}
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Resume + Capabilities */}
        <div className="flex flex-col gap-12 sm:gap-16">
          <ScrollReveal>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-3xl font-bold tracking-tight text-design-light-text-primary sm:text-section">
                Education
              </h2>
              <sup className="text-small font-semibold text-design-light-text-muted sm:text-body">
                ({educations.length})
              </sup>
            </div>
            <ResumeList items={educations} />
          </ScrollReveal>
          <ScrollReveal>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-3xl font-bold tracking-tight text-design-light-text-primary sm:text-section">
                Experience
              </h2>
              <sup className="text-small font-semibold text-design-light-text-muted sm:text-body">
                ({experiences.length})
              </sup>
            </div>
            <ResumeList items={experiences} />
          </ScrollReveal>
          <ScrollReveal>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-3xl font-bold tracking-tight text-design-light-text-primary sm:text-section">
                Capabilities
              </h2>
              <sup className="text-small font-semibold text-design-light-text-muted sm:text-body">
                ({categoriesToRender.length})
              </sup>
            </div>
            {!categoriesToRender.length ? (
              <p className="mt-stack border-t border-design-light-border pt-4 text-small text-design-light-text-muted">
                Capabilities will appear here once they are published in Sanity.
              </p>
            ) : (
            <StaggerReveal className="mt-stack border-t border-design-light-border">
              {categoriesToRender.map((category) => (
                <div
                  key={category._id}
                  className="grid grid-cols-1 gap-2 border-b border-design-light-border px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-design-light-hover"
                >
                  <p className="font-semibold text-design-light-text-primary">{category.title}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-small text-design-light-text-secondary">
                    {category.skills?.map((item, i) => (
                      <span key={item} className="flex items-center gap-2">
                        {i > 0 && <span className="text-design-light-border">·</span>}
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </StaggerReveal>
            )}
          </ScrollReveal>
        </div>
      </div>

      {/* 技能轮播展示 */}
      <div className="pb-12">
        <SkillsMarquee />
      </div>
    </main>
  );
}
