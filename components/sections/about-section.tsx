import Image from "next/image";
import { MapPin, Mail, Languages } from "lucide-react";
import { SkillCategory, ResumeItem } from "@/types";
import { ResumeList } from "./resume-list";

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
      className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-12 pb-[28px] sm:gap-8 sm:px-6 sm:pt-16 sm:pb-[48px] scroll-mt-24"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
          About me
        </p>
        <h2 className="text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
          I blend design systems, interaction, and frontend craft.
        </h2>
        <p className="max-w-3xl text-base text-neutral-700 sm:text-lg">
          Communication Designer and Frontend Developer based in Milan. I enjoy shaping expressive, practical
          experiences—from early concepts and prototyping to polished interfaces that ship. I value
          clarity, rhythm, and small moments of delight.
        </p>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="w-full md:w-[28%] md:sticky md:top-24">
          <div className="scroll-animate">
            <div className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm sm:p-5 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
              {/* <p className="text-sm font-semibold text-neutral-900">Portrait</p> */}
              <div className="relative aspect-[1/1] sm:aspect-[4/5] max-h-[320px] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                <Image
                  src="/Profile_Yuwei.webp"
                  alt="Portrait of Yuwei Li"
                  fill
                  sizes="320px"
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
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 md:w-[72%]">
          <div className="scroll-animate rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-900">
                Education
              </p>
              <Image
                src="/arrow_1.svg"
                alt=""
                width={28}
                height={28}
                className="h-6 w-6"
                priority
              />
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
          </div>
          <div className="scroll-animate rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-900">
                EXPERIENCE
              </p>
              <Image
                src="/arrow_1.svg"
                alt=""
                width={28}
                height={28}
                className="h-6 w-6"
                priority
              />
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
          </div>
          <div className="scroll-animate rounded-2xl border border-neutral-200 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-900">
                CAPABILITIES
              </p>
              <Image
                src="/arrow_1.svg"
                alt=""
                width={28}
                height={28}
                className="h-6 w-6"
                priority
              />
            </div>
            <p className="mt-2 text-sm text-neutral-700">Everything I use to design, build, and ship.</p>

            <div className="mt-6 flex flex-col gap-6">
              {categoriesToRender.map((category) => (
                <div key={category.title || category._id} className="flex flex-col gap-3 sm:flex-row sm:gap-6 sm:items-start border-t border-neutral-100 pt-6 first:border-t-0 first:pt-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:w-1/4 sm:pt-1">
                    {category.title}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:w-3/4">
                    {category.skills?.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-950"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
