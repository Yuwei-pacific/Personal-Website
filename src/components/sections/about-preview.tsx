import Image from "next/image";
import { Link } from "next-view-transitions";

import { Parallax } from "@/components/ui/parallax";
import { RevealText } from "@/components/ui/reveal-text";

export function AboutPreview() {
  return (
    <section id="about" className="relative z-10 w-full bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="relative flex min-h-[22.625rem] flex-col gap-6 lg:min-h-[22.9375rem]">
          <div className="pointer-events-none absolute right-4 top-4 z-0 w-[45%] max-w-[13.1875rem] lg:-top-[1.875rem] lg:right-0 lg:w-[30%] lg:max-w-[20.6875rem]">
            <Parallax offset={-160}>
              <div className="relative aspect-square overflow-hidden rounded-media bg-design-light-raised shadow-card">
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
            <h2 className="text-section font-semibold leading-[1.1] tracking-[-0.025em] text-design-light-text-primary lg:text-display">
              From concept to launch.
            </h2>
            <div className="relative z-10 w-[70%] max-w-[20.5rem] mix-blend-difference lg:w-full lg:max-w-[63rem]">
              <RevealText
                as="p"
                text="I move between visual systems, interface design and frontend development, carrying ideas from early direction to polished, maintainable outcomes."
                fromColor="hsl(var(--color-text-primary-light))"
                toColor="hsl(var(--color-bg-light))"
                className="mt-4 text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.025em] lg:text-display-sm lg:leading-[1.245]"
              />
            </div>
          </div>

          <Link
            href="/about"
            className="relative z-20 inline-flex w-fit border-b-2 border-current text-xl font-semibold leading-[1.15] tracking-[-0.04em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:text-[2.5rem]"
          >
            More about me &gt;
          </Link>
        </div>
      </div>
    </section>
  );
}
