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
  SITE_LOCATIONS,
  SITE_ROLE,
  SOCIAL_LINKS,
} from "@/lib/site-metadata";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { MARK_PATHS } from "@/components/ui/ink/ink-tables";
import { localizedPath } from "@/i18n/routing";

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

export function Footer({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const homePath = localizedPath(locale);
  const siteLinks = [
    { label: dictionary.navigation.home, href: homePath },
    { label: dictionary.navigation.about, href: localizedPath(locale, "/about") },
    { label: dictionary.navigation.work, href: `${homePath}#work` },
  ];

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
      // surface-inverse：页脚是每页唯一反转的区块（浅色模式墨底、深色模式纸底），像书的封底
      className="surface-inverse relative z-10 w-full overflow-hidden bg-design-dark-bg text-design-dark-text-primary"
    >
      <div
        ref={innerRef}
        className="relative z-10 px-edge pb-8 pt-16 will-change-transform sm:px-edge-sm sm:pb-10 sm:pt-28"
      >
        {/* 封底：只有字、一道细线和单色标志，没有墨也没有交互。
            试过「墨线落进标志 + 整块可划开的墨池」，用户觉得乱（2026-11-15）—— 墨只留在首屏和 Work */}
        <div className="flex w-full flex-col">
          <p className="text-label uppercase text-design-dark-text-muted">{dictionary.footer.getInTouch}</p>
          {/* 邮箱：这一屏唯一的大标题（Fraunces） */}
          <a
            href={`mailto:${SITE_EMAIL}`}
            className="group mt-5 flex w-fit max-w-full items-start gap-[0.25em] whitespace-nowrap font-display text-[clamp(1.6rem,6vw,6rem)] leading-none tracking-display text-design-dark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-4 focus-visible:ring-offset-design-dark-bg"
          >
            <span className="transition-opacity duration-base group-hover:opacity-60">{SITE_EMAIL}</span>
            <span
              aria-hidden="true"
              className="mt-[0.15em] font-sans text-[0.4em] transition-transform duration-base ease-design-out group-hover:-translate-y-1 group-hover:translate-x-1"
            >
              ↗
            </span>
          </a>

          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-design-dark-border pt-8 sm:mt-20 sm:grid-cols-12">
            {/* 单色标志：墨的状态（手册：日常都用它），不化开 */}
            <div className="col-span-2 sm:col-span-3">
              <svg
                viewBox="8 7 36 41"
                role="img"
                aria-label={SITE_AUTHOR}
                className="h-12 w-auto fill-current text-design-dark-text-primary sm:h-14"
              >
                {MARK_PATHS.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            </div>

            <nav aria-label={dictionary.footer.aria} className="sm:col-span-3">
              <p className="text-label uppercase text-design-dark-text-muted">{dictionary.footer.site}</p>
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
              <p className="text-label uppercase text-design-dark-text-muted">{dictionary.footer.elsewhere}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.href}>
                    <a href={social.href} target="_blank" rel="noopener noreferrer" className={footerLinkClassName}>
                      <FooterLinkLabel>{social.label}</FooterLinkLabel>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-3">
              <p className="text-label uppercase text-design-dark-text-muted">{dictionary.footer.basedIn}</p>
              <p className="mt-4 text-small text-design-dark-text-secondary">
                {SITE_LOCATIONS[locale]}
                <br />
                {dictionary.footer.workingInternationally}
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-2 text-small text-design-dark-text-muted sm:mt-24 sm:flex-row sm:items-baseline sm:justify-between">
            <p>
              © {year} {SITE_AUTHOR} · {dictionary.footer.rights}
            </p>
            <p>{SITE_ROLE}</p>
            <p>{SITE_DOMAIN}</p>
          </div>
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
