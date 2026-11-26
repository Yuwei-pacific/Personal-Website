"use client";

import { useRef, type CSSProperties } from "react";
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
import { MARK_ASPECT, MARK_BAR } from "@/components/ui/ink/ink-tables";
import { Mark } from "@/components/ui/mark";
import { localizedPath } from "@/i18n/routing";

// 页脚那道线（viewBox 1000 × 100，中线 y = 50，高度 = 标志顶上那一横的粗细）：
// 左端是笔尖，大半段是略有起伏的细墨（约为那一横的八分之一），最后五分之一渐粗到整个高度、接进那一横。
// 手画的固定路径，不是算出来的（手册 08）
const FOOTER_LINE =
  "M0 50C60 46 150 45 260 47C380 49 470 44 590 45C680 46 750 47 800 45C860 42 915 28 955 12C975 4 990 1 1000 0L1000 100C990 99 975 96 955 89C915 75 860 60 800 57C750 55 680 57 590 56C470 55 380 60 260 58C150 56 60 55 0 50Z";

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
      // surface-inverse：页脚是每页唯一反转的区块（浅色模式墨底、深色模式纸底），像书的封底
      className="surface-inverse relative z-10 w-full overflow-hidden bg-design-dark-bg text-design-dark-text-primary"
    >
      <div
        ref={innerRef}
        className="relative z-10 px-edge pb-8 pt-16 will-change-transform sm:px-edge-sm sm:pb-10 sm:pt-28"
      >
        {/* 封底：和首屏（封面）是一对。封面是纸上化开的大标志和一根流进顶上那一横的墨线；封底是墨底上同一个构图的
            「墨迹的状态」—— 标志实心、单色，线是同一根线去掉晕之后剩下的那一道（用户 2026-11-16：把分隔线换成
            首屏那种、去掉弥散、安静一点）。所有宽度都是这个构图。没有画布也没有交互：试过「墨线落进小标志 + 整块可划开的墨池」，
            用户觉得乱（2026-11-15）—— 化开的墨只留在首屏和 Work。
            --fm-h / --fm-w：大标志的高和宽（墨迹的外框接近正方形）；--fm-bar：顶上那一横的粗细 */}
        <div
          className="flex w-full flex-col [--fm-h:clamp(6.75rem,22vw,23rem)]"
          style={
            {
              "--fm-w": `calc(var(--fm-h) * ${MARK_ASPECT.toFixed(4)})`,
              "--fm-bar": `calc(var(--fm-h) * ${MARK_BAR.thickness})`,
            } as CSSProperties
          }
        >
          <p className="text-label uppercase text-design-dark-text-muted">{dictionary.footer.getInTouch}</p>
          {/* 邮箱：这一屏唯一的大标题（Fraunces） */}
          <a
            href={`mailto:${SITE_EMAIL}`}
            className="group mt-5 flex w-fit max-w-full items-start gap-[0.25em] whitespace-nowrap font-display text-[clamp(1.6rem,6vw,6rem)] leading-none tracking-display text-design-dark-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-4 focus-visible:ring-offset-design-dark-bg lg:text-[clamp(2.5rem,5vw,5.5rem)]"
          >
            <span className="transition-opacity duration-base group-hover:opacity-60">{SITE_EMAIL}</span>
            <span
              aria-hidden="true"
              className="mt-[0.15em] font-sans text-[0.4em] transition-transform duration-base ease-design-out group-hover:-translate-y-1 group-hover:translate-x-1"
            >
              ↗
            </span>
          </a>

          {/* 线和标志这一行：首屏那根线去掉晕 —— 从视口左缘出发、略有起伏，流进标志顶上那一横的左端，
              像同一笔写出来的。标志挂在线下面：那一横的中线就是这一行的顶边。
              线画在一个和那一横一样高的盒子里（横向拉伸）：大半段是一道细墨，临到标志才按下去、粗到那一横的粗细 */}
          <div className="relative mt-14 lg:mt-16">
            {/* 外层定左右端（SVG 自己带固有比例，直接用 left/right 撑不开），里面的线拉伸铺满 */}
            <div
              aria-hidden="true"
              className="absolute -left-edge h-[var(--fm-bar)] -translate-y-1/2 text-design-dark-text-primary sm:-left-edge-sm"
              style={{ right: `calc(var(--fm-w) * ${(1 - MARK_BAR.x - 0.06).toFixed(3)})` }}
            >
              <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="block h-full w-full fill-current">
                <path d={FOOTER_LINE} />
              </svg>
            </div>
            <Mark
              label={SITE_AUTHOR}
              className="absolute right-0 h-[var(--fm-h)] w-[var(--fm-w)] text-design-dark-text-primary"
              style={{ top: `calc(var(--fm-h) * ${-MARK_BAR.y})` }}
            />
          </div>

          {/* 链接三栏在左，标志挂在右：这一块至少和标志一样高，下面的版权行才不会碰到标志的脚。
              手机上两栏链接会排到标志底下，所以先让出标志的高度 */}
          <div className="min-h-[var(--fm-h)] pt-[calc(var(--fm-h)+1.5rem)] sm:pt-14 lg:pt-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:w-3/4 sm:grid-cols-3 lg:w-2/3">

            <nav aria-label={dictionary.footer.aria}>
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

            <div>
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

            <div className="col-span-2 sm:col-span-1">
              <p className="text-label uppercase text-design-dark-text-muted">{dictionary.footer.basedIn}</p>
              <p className="mt-4 text-small text-design-dark-text-secondary">
                {SITE_LOCATIONS[locale]}
                <br />
                {dictionary.footer.workingInternationally}
              </p>
              {/* 接项目：页脚没有化开的东西，可以放 Coral 的圆点 —— 只落在点上，字还是墨写的（手册 03） */}
              <p className="mt-3 flex items-center gap-2 text-small text-design-dark-text-secondary">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
                {dictionary.home.hero.availability}
              </p>
            </div>
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
