import type { Metadata } from "next";
import Image from "next/image";

import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "About Me | Yuwei Li",
  description: "Learn more about Yuwei Li — background, education, experience, and skills.",
};

export default function About() {
  const projects = [
    {
      title: "Portfolio Platform",
      role: "Product design · Frontend build",
      description: "Responsive experience showcasing design systems, animations, and storytelling.",
    },
    {
      title: "Data Visualization Lab",
      role: "Interaction design",
      description: "Experimental visual narratives combining charts, motion, and UI micro-interactions.",
    },
    {
      title: "Learning Toolkit",
      role: "UX · UI",
      description: "Modular components for online courses, focused on clarity and retention.",
    },
  ];
  return (
    <div className="min-h-screen" id="home">
      <Navbar />
      <Hero />
      <section
        id="about"
        className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-14 sm:gap-8 sm:py-16 scroll-mt-24"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            About me
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
            I blend design systems, interaction, and frontend craft.
          </h2>
          <p className="max-w-3xl text-base text-neutral-700 sm:text-lg">
            Product designer and frontend builder based in Milan. I enjoy shaping expressive,
            practical experiences—from early concepts and prototyping to polished interfaces that
            ship. I value clarity, rhythm, and small moments of delight.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full md:w-1/3">
            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-neutral-900">Portrait</p>
              <div className="relative mt-3 aspect-[4/5] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                <Image
                  src="/Profile_Yuwei.webp"
                  alt="Portrait of Yuwei Li"
                  fill
                  sizes="320px"
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-4 md:w-2/3">
            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
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
              <div className="mt-4 space-y-4 text-neutral-800">
                <div className="flex items-stretch gap-3">
                  <Image
                    src="/diamond_2.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-full min-h-[72px] w-5 self-stretch"
                    priority
                  />
                  <div className="space-y-1">
                    <p className="text-base font-semibold">Politecnico di Milano</p>
                    <p className="text-sm text-neutral-700">
                      Laurea Magistrale LM, Comunicazione design
                    </p>
                    <p className="text-sm text-neutral-700">2023 – 2026</p>
                  </div>
                </div>
                <div className="flex items-stretch gap-3">
                  <Image
                    src="/diamond_2.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-full min-h-[72px] w-5 self-stretch"
                    priority
                  />
                  <div className="space-y-1">
                    <p className="text-base font-semibold">Accademia di Belle Arti di Firenze</p>
                    <p className="text-sm text-neutral-700">Visive, decorazione</p>
                    <p className="text-sm text-neutral-700">2019 – 2023</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
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
              <p className="mt-2 text-sm text-neutral-700">
                I have gained experience across design, web development, and team coordination,
                working on projects that range from corporate events and branding to online learning
                platforms and IT management. These roles allowed me to combine creative design
                thinking with technical problem-solving, shaping a versatile practice that bridges
                creativity and technology.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <p className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-900">
              Skills & Tools
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
          <p className="mt-2 text-sm text-neutral-700">
            Core design and delivery stack I use across projects.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Product Design",
              "Interaction Design",
              "Design Systems",
              "Prototyping",
              "Figma",
              "Protopie",
              "Next.js",
              "React",
              "TypeScript",
              "Tailwind CSS",
              "shadcn/ui",
              "Framer Motion",
              "User Research",
              "Usability Testing",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-neutral-300 bg-white/80 px-3 py-1 text-xs font-medium text-neutral-800 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section
        id="work"
        className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-16 sm:gap-8 sm:pb-20 scroll-mt-24"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            My Projects
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
            Selected work across design and build.
          </h2>
          <p className="max-w-3xl text-base text-neutral-700 sm:text-lg">
            A snapshot of recent projects spanning design systems, interaction, and frontend delivery.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.title}
              className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur"
            >
              <p className="text-lg font-semibold text-neutral-900">{project.title}</p>
              <p className="text-sm font-medium text-neutral-600">{project.role}</p>
              <p className="mt-2 text-sm text-neutral-700">{project.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
