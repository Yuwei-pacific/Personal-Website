// CMS 兜底内容：Sanity 请求失败或对应类型暂无数据时展示。
// 这是「内容」而不是 UI —— 修改文案在这里改，不要写进组件。
// 形状与 TypeGen 生成的查询结果一致（见 types/*.ts）。
import type { ResumeItem, SkillCategory } from "@/types";

export const fallbackSkillCategories: SkillCategory[] = [
  {
    _id: "fallback-design",
    title: "Design Disciplines",
    order: 1,
    skills: ["User Experience", "User Interface", "Interaction Design", "Communication Design", "Branding Design", "Design Systems", "Prototyping", "User Research"],
  },
  {
    _id: "fallback-tools",
    title: "Tools & Software",
    order: 2,
    skills: ["Figma", "Protopie", "Adobe XD", "Photoshop", "Illustrator", "Premiere Pro", "After Effects"],
  },
  {
    _id: "fallback-frontend",
    title: "Frontend Development",
    order: 3,
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML/CSS", "JavaScript"],
  },
];

export const fallbackEducation: ResumeItem[] = [
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
  },
];

export const fallbackExperience: ResumeItem[] = [
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
        children: [
          {
            _type: "span",
            _key: "exp-default-1-span-0",
            text: "I have gained experience across design, web development, and team coordination, working on projects that range from corporate events and branding to online learning platforms and IT management. These roles allowed me to combine creative design thinking with technical problem-solving, shaping a versatile practice that bridges creativity and technology.",
          },
        ],
      },
    ],
  },
];
