import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { AboutPageContent } from "@/components/sections/about/about-page-content";
import { Footer } from "@/components/layout/footer";
import { JsonLd, personSchema } from "@/components/seo/json-ld";
import { normalizeAboutData } from "@/lib/view-models/home";
import { sanityFetch } from "@/sanity/live";
import { RESUME_QUERY, SKILLS_QUERY } from "@/sanity/queries";
import type {
  RESUME_QUERY_RESULT,
  SKILLS_QUERY_RESULT,
} from "@/sanity/sanity.types";

const ABOUT_TITLE = "About Yuwei Li";
const ABOUT_DESCRIPTION =
  "Meet Yuwei Li, a Milan-based Communication Designer and Frontend Developer working across visual identity, digital interfaces and custom websites.";

export const revalidate = 60;

export const metadata: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    url: "/about",
    title: `${ABOUT_TITLE} | Yuwei Design`,
    description: ABOUT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${ABOUT_TITLE} | Yuwei Design`,
    description: ABOUT_DESCRIPTION,
  },
};

export default async function AboutPage() {
  let skillCategories: SKILLS_QUERY_RESULT = [];
  let resumeItems: RESUME_QUERY_RESULT = [];

  try {
    const [skillsResult, resumeResult] = await Promise.all([
      sanityFetch({ query: SKILLS_QUERY, perspective: "published", stega: false }),
      sanityFetch({ query: RESUME_QUERY, perspective: "published", stega: false }),
    ]);
    skillCategories = skillsResult.data;
    resumeItems = resumeResult.data;
  } catch (error) {
    console.error("Failed to fetch About data from Sanity", error);
  }

  const aboutData = normalizeAboutData({ skillCategories, resumeItems });

  return (
    <>
      <JsonLd data={personSchema} />
      <Navbar />
      <AboutPageContent
        skillCategories={aboutData.skillCategories}
        resumeItems={aboutData.resumeItems}
      />
      <Footer />
    </>
  );
}
