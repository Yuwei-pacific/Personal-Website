import Image from "next/image";
import { MapPin, Mail, Languages } from "lucide-react";
import { SkillCategory, ResumeItem } from "@/types";
import { ResumeList } from "./resume-list";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { RevealText } from "@/components/ui/reveal-text";
import { Parallax } from "@/components/ui/parallax";

type AboutSectionProps = {
  skillCategories?: SkillCategory[];
  resumeItems?: ResumeItem[];
};

export function AboutSection({ skillCategories, resumeItems }: AboutSectionProps) {
  // 分离 Education 和 Experience 数据
  const educations = resumeItems?.filter(item => item.type === 'education' || !item.type) || [];
  const experiences = resumeItems?.filter(item => item.type === 'experience') || [];

  // 后备数据
  const categoriesToRender = skillCategories && skillCategories.length > 0
    ? skillCategories
    : [
      {
        title: "Design Disciplines",
        skills: ["User Experience", "User Interface", "Interaction Design", "Communication Design", "Branding Design", "Design Systems", "Prototyping", "User Research"]
      },
      {
        title: "Tools & Software",
        skills: ["Figma", "Protopie", "Adobe XD", "Photoshop", "Illustrator", "Premiere Pro", "After Effects"]
      },
      {
        title: "Frontend Development",
        skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML/CSS", "JavaScript"]
      }
    ];
  return (
    <section
      id="about"
      className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-12 pb-[28px] sm:gap-14 sm:px-6 sm:pt-16 sm:pb-[48px] scroll-mt-24"
    >
      {/* Intro: 大字逐词点亮的自我介绍 + 人像与简易信息 */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
        <Parallax offset={-80} className="w-full lg:order-1 lg:flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            About me
          </p>
          <RevealText
            text="Design is how I make sense of ideas — sketching, prototyping, and writing code until something finally clicks. I move between Figma and the browser, shaping rough concepts into interfaces people enjoy using. Curiosity keeps me building, one small detail at a time."
            className="mt-4 text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
          />
        </Parallax>

        <Parallax offset={160} className="w-full lg:order-2 lg:w-[28%]">
          <ScrollReveal>
            <div className="cursor-hover relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
              <Image
                src="/Profile_Yuwei.webp"
                alt="Portrait of Yuwei Li"
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="object-cover object-top"
                priority
              />
            </div>

            {/* Basic Info */}
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Yuwei Li</h3>
                <p className="text-sm text-neutral-600">Communication Designer & Frontend Developer</p>
              </div>

              <div className="space-y-1.5 text-sm font-medium text-neutral-600">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  <span>Milan, Italy</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  <a href="mailto:snowtime200801@gmail.com" className="transition-colors hover:text-neutral-900">
                    snowtime200801@gmail.com
                  </a>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  <Languages className="h-3.5 w-3.5" />
                  <span>Languages</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    Chinese — Native
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    English — B2
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    Italiano — B2
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Parallax>
      </div>

      {/* Resume + Capabilities */}
      <div className="flex flex-col gap-4">
        <ScrollReveal>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Education
            </h3>
            <sup className="text-sm font-semibold text-neutral-500 sm:text-base">
              ({educations.length})
            </sup>
          </div>
          <ResumeList
            items={educations}
            fallbackData={[
              {
                _id: "edu-default-1",
                institution: "Politecnico di Milano",
                degree: "Laurea Magistrale LM, Comunicazione design",
                period: "2023 – 2026",
              },
              {
                _id: "edu-default-2",
                institution: "Accademia di Belle Arti di Firenze",
                degree: "Visive, decorazione",
                period: "2019 – 2023",
              }
            ]}
          />
        </ScrollReveal>
        <ScrollReveal>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Experience
            </h3>
            <sup className="text-sm font-semibold text-neutral-500 sm:text-base">
              ({experiences.length})
            </sup>
          </div>
          <ResumeList
            items={experiences}
            fallbackData={[
              {
                _id: "exp-default-1",
                institution: "Multi-disciplinary Experience",
                degree: "Design, Web Development, Team Coordination",
                period: "Past – Present",
                details: [
                  {
                    _type: "block",
                    children: [{
                      _type: "span",
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
            <h3 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Capabilities
            </h3>
            <sup className="text-sm font-semibold text-neutral-500 sm:text-base">
              ({categoriesToRender.length})
            </sup>
          </div>
          <p className="mt-2 text-sm text-neutral-600">Everything I use to design, build, and ship.</p>

          <div className="mt-6 border-t border-neutral-300">
            {categoriesToRender.map((category) => (
              <div
                key={category.title || category._id}
                className="grid grid-cols-1 gap-2 border-b border-neutral-300 px-1 py-4 transition-colors sm:grid-cols-[1fr_3fr] sm:items-center sm:gap-4 sm:hover:bg-neutral-50"
              >
                <p className="font-semibold text-neutral-900">{category.title}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-600">
                  {category.skills?.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
