import Image from "next/image";
import Link from "next/link";

import { ArrowRight, Github, Linkedin, Instagram } from "lucide-react";

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
          className="select-none object-contain object-center sm:object-[50%_10%] opacity-50 blur-md"
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
            <Link href="mailto:snowtime200801@gmail.com">Contact me Via mail</Link>
          </Button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <p className="text-xl font-semibold uppercase tracking-[0.2em] text-neutral-900 sm:text-2xl">
                Get in touch
              </p>
              <Image
                src="/arrow_1.svg"
                alt="Directional arrow"
                width={29}
                height={22}
                className="h-[18px] w-auto sm:h-[22px]"
              />
            </div>
            <div className="h-px flex-1 bg-neutral-900" />
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="https://github.com/Yuwei-pacific"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900/80 text-neutral-900 transition hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/yuwei081/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-neutral-900/80 text-neutral-900 transition hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/yuwei081/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900/80 text-neutral-900 transition hover:bg-neutral-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <p className="text-sm text-neutral-700 sm:text-base">Mail: snowtime200801@gmail.com</p>
        </div>
      </div>
    </section>
  );
}
