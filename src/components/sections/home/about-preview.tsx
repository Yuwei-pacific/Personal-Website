import Image from "next/image";
import { Link } from "next-view-transitions";

import { Parallax } from "@/components/ui/parallax";
import { MaskedTextHeading } from "@/components/ui/masked-text-heading";
import { RevealText } from "@/components/ui/reveal-text";

export function AboutPreview() {
  return (
    <section id="about" className="relative z-10 isolate w-full bg-background">
      <div className="mx-auto w-full max-w-content px-6 py-section sm:py-section-sm">
        <div className="relative flex flex-col gap-8 lg:min-h-[22.9375rem] lg:gap-6">
          <div className="pointer-events-none absolute right-0 top-[8.25rem] z-0 w-[46%] max-w-44 lg:-top-[1.875rem] lg:right-0 lg:w-[30%] lg:max-w-[20.6875rem]">
            <Parallax offset={-160} mobileOffset={-64}>
              <div className="relative aspect-square overflow-hidden bg-design-light-raised shadow-card">
                <Image
                  src="/Profile_Yuwei.webp"
                  alt="Portrait of Yuwei Li"
                  fill
                  sizes="(min-width: 1024px) 331px, 45vw"
                  className="object-cover object-top"
                />
              </div>
            </Parallax>
          </div>

          <div className="relative">
            <MaskedTextHeading
              text="From concept to launch."
              className="text-balance text-display-sm font-semibold leading-[1.1] tracking-display text-design-light-text-primary lg:text-display"
            />
            <div className="relative z-10 w-full mix-blend-difference lg:max-w-[63rem]">
              <RevealText
                as="p"
                text="I move between visual systems, interface design and frontend development, carrying ideas from early direction to polished, maintainable outcomes."
                fromColor="hsl(var(--color-text-primary-light))"
                toColor="hsl(var(--color-bg-light))"
                className="mt-4 text-pretty text-lead font-semibold tracking-display lg:text-display-sm lg:leading-[1.245]"
              />
            </div>
          </div>

          <Link
            href="/about"
            className="relative z-20 inline-flex min-h-11 w-fit touch-manipulation items-center border-b-2 border-current text-lg font-semibold leading-[1.15] tracking-[-0.04em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:min-h-0 lg:text-[2.5rem]"
          >
            More about me &gt;
          </Link>
        </div>
      </div>
    </section>
  );
}
