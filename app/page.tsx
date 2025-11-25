import { AboutSection } from "@/components/about-section";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { ProjectsSection, type Project } from "@/components/projects-section";
import { isSanityConfigured, sanityClient } from "@/lib/sanity";
import groq from "groq";

export const metadata = {
  title: "Yuwei Li",
  description: "Portfolio of Yuwei Li.",
};


const PROJECTS_QUERY = groq`*[_type == "project"] | order(_createdAt desc){
  _id,
  title,
  role,
  description
}`;

export default async function HomePage() {
  let projects: Project[] = [
    {
      _id: "sample-1",
      title: "Portfolio Platform",
      role: "Product design · Frontend build",
      description: "Responsive experience showcasing design systems, animations, and storytelling.",
    },
    {
      _id: "sample-2",
      title: "Data Visualization Lab",
      role: "Interaction design",
      description: "Experimental visual narratives combining charts, motion, and UI micro-interactions.",
    },
    {
      _id: "sample-3",
      title: "Learning Toolkit",
      role: "UX · UI",
      description: "Modular components for online courses, focused on clarity and retention.",
    },
  ];

  if (isSanityConfigured() && sanityClient) {
    try {
      const result = await sanityClient.fetch<Project[]>(PROJECTS_QUERY);
      if (result?.length) {
        projects = result;
      }
    } catch (error) {
      console.error("Failed to fetch projects from Sanity", error);
    }
  }

  return (
    <div className="min-h-screen" id="home">
      <Navbar />
      <Hero />
      <AboutSection />
      <ProjectsSection projects={projects} />
    </div>
  );
}
