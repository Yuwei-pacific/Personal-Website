import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-screen w-full items-center overflow-hidden px-6 py-16 sm:px-10 md:px-16">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0FBFF] via-[##FFFAFA] to-[#FFFFF2]" />
        <Image
          src="/hero_mg.svg"
          alt="Hero background graphic"
          fill
          priority
          sizes="100vw"
          className="select-none object-contain object-[50%_10%] opacity-50 blur-md"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-600">
            Portfolio
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Creative Designer
          </h1>
          <p className="max-w-2xl text-lg text-neutral-700 sm:text-xl">
            I design and build vivid digital experiences.
            <br />
            that bring color to the ordinary.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">Based in Milan</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-xs">
              Available for freelance
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" asChild>
            <Link href="#work">
              View work <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="mailto:snowtime200801@gmail.com">Contact me</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/50 pt-6">
          <div className="flex flex-col gap-1 text-neutral-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <span className="text-lg font-semibold uppercase tracking-wide">
                Get in touch
              </span>
              <svg
                className="h-4 w-5 text-neutral-800"
                viewBox="0 0 24 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 6H18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M13 1L18 6L13 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden flex-1 border-b border-neutral-800 sm:block" />
            </div>
            <div className="flex items-center gap-4 text-black sm:pl-4">
              <Link
                href="https://www.instagram.com"
                className="transition hover:opacity-70"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              </Link>
              <Link
                href="https://www.linkedin.com"
                className="transition hover:opacity-70"
                aria-label="LinkedIn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path
                    d="M8 17V10M8 7.5h.01M12 17v-3.5c0-1.5.75-2.5 2.25-2.5 1.25 0 1.75.75 1.75 2.5V17"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
              <Link
                href="mailto:snowtime200801@gmail.com"
                className="transition hover:opacity-70"
                aria-label="Email"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    d="M7.5 10.5 12 13l4.5-2.5"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 9h8"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
          <div className="text-sm text-neutral-800">
            snowtime200801@gmail.com
          </div>
        </div>
      </div>
    </section>
  );
}
