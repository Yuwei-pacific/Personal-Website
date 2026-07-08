import Image from "next/image";
import { SkillCategory, ResumeItem } from "@/types";
import { ResumeList } from "./resume-list";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { StaggerReveal } from "@/components/ui/stagger-reveal";
import { RevealText } from "@/components/ui/reveal-text";
import { Parallax } from "@/components/ui/parallax";
import { SkillsMarquee } from "@/components/ui/skills-marquee";

type AboutSectionProps = {
  skillCategories?: SkillCategory[];
  resumeItems?: ResumeItem[];
};

export function AboutSection({ skillCategories, resumeItems }: AboutSectionProps) {
  // 分离 Education 和 Experience 数据
  const educations = resumeItems?.filter(item => item.type === 'education' || !item.type) || [];
  const experiences = resumeItems?.filter(item => item.type === 'experience') || [];

  // 后备数据（与 SkillCategory 查询结果同构，CMS 无数据时展示）
  const fallbackCategories: SkillCategory[] = [
    {
      _id: "fallback-design",
      title: "Design Disciplines",
      order: 1,
      skills: ["User Experience", "User Interface", "Interaction Design", "Communication Design", "Branding Design", "Design Systems", "Prototyping", "User Research"]
    },
    {
      _id: "fallback-tools",
      title: "Tools & Software",
      order: 2,
      skills: ["Figma", "Protopie", "Adobe XD", "Photoshop", "Illustrator", "Premiere Pro", "After Effects"]
    },
    {
      _id: "fallback-frontend",
      title: "Frontend Development",
      order: 3,
      skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML/CSS", "JavaScript"]
    }
  ];
  const categoriesToRender = skillCategories && skillCategories.length > 0
    ? skillCategories
    : fallbackCategories;
  return (
    <section
      id="about"
      className="w-full bg-background relative z-10 scroll-mt-24"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-gap-section px-container pt-section pb-7 sm:gap-gap-section-sm sm:px-container-sm sm:pt-section-sm sm:pb-12">
        {/* Intro: 大字逐词点亮的自我介绍，人像与文字左右排版 */}
        <div className="flex flex-col gap-10">
          {/* Edwin Le style layout - Image absolutely positioned on the right, overlapping the text on the left */}
          <div className="relative pb-8 sm:pb-0">
            {/* Portrait on the right side — outer div owns position, inner Parallax
              owns the transform (drifts upward on scroll) so they don't conflict */}
            <div className="pointer-events-none absolute right-0 top-1/2 w-[45%] max-w-[240px] -translate-y-1/2 sm:w-[35%] sm:max-w-[320px] lg:w-[30%] lg:max-w-[360px]">
              <Parallax offset={-160}>
                <div className="group relative aspect-square overflow-hidden rounded-media bg-design-light-elevated shadow-card transition-shadow duration-slow hover:shadow-hover">
                  <Image
                    src="/Profile_Yuwei.webp"
                    alt="Portrait of Yuwei Li"
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 240px"
                    className="object-cover object-top transition-transform duration-media ease-design-out group-hover:scale-emphasis"
                    priority
                  />
                  {/* Sleek overlay hover effect */}
                  <div className="absolute inset-0 bg-design-light-accent/5 opacity-0 transition-opacity duration-slow group-hover:opacity-100 pointer-events-none" />
                </div>
              </Parallax>
            </div>

            {/* Text on top — inverts over the photo via mix-blend-difference */}
            <div className="relative z-10 mix-blend-difference pr-[30%] sm:pr-[24%] lg:pr-[20%]">
              {/* 用 h2 保证标题层级连续（h1 Hero → h2 About → h3 Education/Experience/Capabilities） */}
              <h2 className="text-label font-semibold uppercase text-design-light-text-muted">
                About me
              </h2>
              <RevealText
                text="I design and build digital experiences that turn ideas into clear, usable interfaces."
                fromColor="hsl(var(--color-text-primary-light))"
                toColor="hsl(var(--color-bg-light))"
                className="mt-4 text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
              />
            </div>
          </div>


          {/* Basic info — same row-table style as Education / Experience / Capabilities */}
          <ScrollReveal>
            <div className="border-t border-design-light-border">
              {/* <div className="grid grid-cols-1 gap-1 border-b border-neutral-300 px-1 py-4 transition-[padding,background-color] duration-300 sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-neutral-50">
              <p className="font-semibold text-neutral-900">Name</p>
              <p className="text-base font-semibold text-neutral-900">Yuwei Li</p>
            </div> */}
              <div className="grid grid-cols-1 gap-1 border-b border-design-light-border px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-design-light-hover">
                <p className="font-semibold text-design-light-text-primary">Role</p>
                <p className="text-small text-design-light-text-secondary sm:text-body">Communication Designer &amp; Frontend Developer</p>
              </div>
              <div className="grid grid-cols-1 gap-1 border-b border-design-light-border px-1 py-4 transition-[padding,background-color] duration-base sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-design-light-hover">
                <p className="font-semibold text-design-light-text-primary">Location</p>
                <p className="text-small text-design-light-text-secondary sm:text-body">Milan, Italy</p>
              </div>
              {/* <div className="grid grid-cols-1 gap-1 border-b border-neutral-300 px-1 py-4 transition-[padding,background-color] duration-300 sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:pl-3 sm:hover:bg-neutral-50">
                <p className="font-semibold text-neutral-900">Email</p>
                <a
                  href="mailto:snowtime200801@gmail.com"
                  className="text-sm text-neutral-700 transition-colors hover:text-neutral-950 sm:text-base"
                >
                  snowtime200801@gmail.com
                </a>
              </div> */}
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
              <h3 className="text-3xl font-bold tracking-tight text-design-light-text-primary sm:text-section">
                Education
              </h3>
              <sup className="text-small font-semibold text-design-light-text-muted sm:text-body">
                ({educations.length})
              </sup>
            </div>
            <ResumeList
              items={educations}
              fallbackData={[
                {
                  _id: "edu-default-1",
                  type: "education",
                  institution: "Politecnico di Milano",
                  degree: "Laurea Magistrale LM, Comunicazione design",
                  period: "2023 – 2026",
                  location: null,
                  details: null,
                  order: null,
                },
                {
                  _id: "edu-default-2",
                  type: "education",
                  institution: "Accademia di Belle Arti di Firenze",
                  degree: "Visive, decorazione",
                  period: "2019 – 2023",
                  location: null,
                  details: null,
                  order: null,
                }
              ]}
            />
          </ScrollReveal>
          <ScrollReveal>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold tracking-tight text-design-light-text-primary sm:text-section">
                Experience
              </h3>
              <sup className="text-small font-semibold text-design-light-text-muted sm:text-body">
                ({experiences.length})
              </sup>
            </div>
            <ResumeList
              items={experiences}
              fallbackData={[
                {
                  _id: "exp-default-1",
                  type: "experience",
                  institution: "Multi-disciplinary Experience",
                  degree: "Design, Web Development, Team Coordination",
                  period: "Past – Present",
                  location: null,
                  order: null,
                  details: [
                    {
                      _type: "block",
                      _key: "exp-default-1-block-0",
                      children: [{
                        _type: "span",
                        _key: "exp-default-1-span-0",
                        text: "I have gained experience across design, web development, and team coordination, working on projects that range from corporate events and branding to online learning platforms and IT management. These roles allowed me to combine creative design thinking with technical problem-solving, shaping a versatile practice that bridges creativity and technology."
                      }]
                    }
                  ]
                }
              ]}
            />
          </ScrollReveal>
          <ScrollReveal>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold tracking-tight text-design-light-text-primary sm:text-section">
                Capabilities
              </h3>
              <sup className="text-small font-semibold text-design-light-text-muted sm:text-body">
                ({categoriesToRender.length})
              </sup>
            </div>
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
          </ScrollReveal>
        </div>
      </div>

      {/* 技能轮播展示 */}
      <div className="pb-12">
        <SkillsMarquee />
      </div>
    </section>
  );
}
