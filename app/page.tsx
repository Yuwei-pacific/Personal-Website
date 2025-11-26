import { AboutSection } from "@/components/sections/about-section";
import { Hero } from "@/components/sections/hero";
import { Navbar } from "@/components/layout/navbar";
import { ProjectsSection, type Project } from "@/components/sections/projects-section";
import { isSanityConfigured, sanityClient } from "@/lib/sanity";
import groq from "groq";

export const metadata = {
  title: "Yuwei Li",
  description: "Portfolio of Yuwei Li.",
};


const PROJECTS_QUERY = groq`*[_type == "project"] | order(_createdAt desc){
  _id,
  title,
  summary,
  year,
  projectType,
  description,
  "slug": slug.current
}`;

export default async function HomePage() {
  let projects: Project[] = [];

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
