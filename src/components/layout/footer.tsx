"use client";

import { useRef } from "react";
import { Link } from "next-view-transitions";

import {
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/animation/scroll-trigger";
import {
  SITE_AUTHOR,
  SITE_DOMAIN,
  SITE_EMAIL,
  SITE_LOCATION,
  SITE_ROLE,
  SOCIAL_LINKS,
} from "@/lib/site-metadata";

const siteLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Work", href: "/#work" },
];

const footerLinkClassName =
  "group flex w-fit items-center gap-2 text-small text-design-dark-text-secondary transition-colors duration-base hover:text-design-dark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-4 focus-visible:ring-offset-design-dark-bg";

function FooterLinkLabel({ children }: { children: string }) {
  return (
    <>
      <span className="transition-transform duration-base ease-design-out group-hover:translate-x-1">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="opacity-0 transition-opacity duration-base group-hover:opacity-100"
      >
        ↗
      </span>
    </>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const footer = footerRef.current;
      const inner = innerRef.current;
      const overlay = overlayRef.current;

      if (!footer || !inner || !overlay) return;

      if (prefersReducedMotion()) {
        gsap.set(inner, { yPercent: 0 });
        gsap.set(overlay, { opacity: 0 });
        return;
      }

      const media = gsap.matchMedia();
      const createFooterReveal = (
        yPercent: number,
        overlayOpacity: number
      ) => {
        const scrollTrigger = {
          trigger: footer,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        } as const;

        gsap.fromTo(
          inner,
          { yPercent },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger,
          }
        );

        gsap.fromTo(
          overlay,
          { opacity: overlayOpacity },
          {
            opacity: 0,
            ease: "none",
            scrollTrigger,
          }
        );
      };

      media.add("(min-width: 1024px)", () => {
        createFooterReveal(-18, 0.3);
      });

      media.add("(max-width: 1023px)", () => {
        createFooterReveal(-8, 0.18);
      });

      return () => media.revert();
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      data-overscroll-dark
      className="relative z-10 w-full overflow-hidden bg-design-dark-bg text-design-dark-text-primary"
    >
      <div
        ref={innerRef}
        className="relative z-10 min-h-[42rem] px-container pb-8 pt-8 will-change-transform sm:min-h-[48rem] sm:px-container-sm sm:pb-10 sm:pt-10"
      >
        <div className="flex min-h-[inherit] w-full flex-col">
          <div className="grid gap-5 border-t border-design-dark-border pt-5 sm:grid-cols-12 sm:gap-6">
            <p className="text-label font-semibold uppercase text-design-dark-text-muted sm:col-span-3">
              Get in touch
            </p>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="group flex w-fit max-w-full items-start gap-2 break-words text-[clamp(1.55rem,6.25vw,5rem)] font-semibold leading-[0.92] tracking-display text-design-dark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-4 focus-visible:ring-offset-design-dark-bg sm:col-span-9 sm:break-normal"
            >
              <span className="transition-opacity duration-base group-hover:opacity-60">
                {SITE_EMAIL}
              </span>
              <span
                aria-hidden="true"
                className="mt-[0.1em] text-[0.45em] font-normal transition-transform duration-base ease-design-out group-hover:-translate-y-1 group-hover:translate-x-1"
              >
                ↗
              </span>
            </a>
          </div>

          <div className="flex flex-1 items-center py-16 sm:py-20">
            <p
              aria-hidden="true"
              className="w-full text-[clamp(4.5rem,16vw,12rem)] font-semibold uppercase leading-[0.72] tracking-[-0.075em] text-design-dark-text-primary"
            >
              <span className="block sm:inline">Yuwei</span>{" "}
              <span className="block text-design-dark-text-muted sm:inline">
                Li
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-design-dark-border pt-6 sm:grid-cols-12">
            <nav aria-label="Footer" className="sm:col-span-3">
              <p className="text-label font-semibold uppercase text-design-dark-text-muted">
                Site
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {siteLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={footerLinkClassName}>
                      <FooterLinkLabel>{link.label}</FooterLinkLabel>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="sm:col-span-3">
              <p className="text-label font-semibold uppercase text-design-dark-text-muted">
                Elsewhere
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={footerLinkClassName}
                    >
                      <FooterLinkLabel>{social.label}</FooterLinkLabel>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-3">
              <p className="text-label font-semibold uppercase text-design-dark-text-muted">
                Based in
              </p>
              <p className="mt-4 text-small text-design-dark-text-secondary">
                {SITE_LOCATION}
                <br />
                Working internationally
              </p>
            </div>

            <div className="flex flex-col justify-end gap-2 text-small text-design-dark-text-muted sm:col-span-3 sm:items-end sm:text-right">
              <p>
                {SITE_AUTHOR}
                <br />© {year} All rights reserved
              </p>
              <p>{SITE_DOMAIN}</p>
            </div>
          </div>

          <p className="mt-8 border-t border-design-dark-border pt-5 text-small text-design-dark-text-muted sm:text-right">
            {SITE_ROLE}
          </p>
        </div>
      </div>

      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 bg-black opacity-0 [will-change:opacity]"
      />
    </footer>
  );
}
