// 站点页脚：联系入口 + 社交 + 站内导航。
// 深色收尾，与首页 Work 区 / 详情页画廊无缝衔接；带 data-overscroll-dark
// 让过界回弹时 body 背景保持深色（见 OverscrollBackground）。
import { Link } from "next-view-transitions";

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

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-overscroll-dark
      className="relative z-10 w-full bg-design-dark-bg px-container pb-10 pt-panel text-design-dark-text-primary sm:px-container-sm sm:pt-panel-sm"
    >
      <div className="mx-auto flex max-w-content flex-col gap-12">
        {/* 联系入口：整个页脚最主要的动作 */}
        <div className="flex flex-col gap-4">
          <p className="text-label font-semibold uppercase text-design-dark-text-muted">
            Get in touch
          </p>
          <a
            href={`mailto:${SITE_EMAIL}`}
            className="w-fit border-b-2 border-current text-2xl font-semibold tracking-tight text-design-dark-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-design-dark-text-primary focus-visible:ring-offset-4 focus-visible:ring-offset-design-dark-bg sm:text-3xl"
          >
            {SITE_EMAIL}
          </a>
        </div>

        <div className="grid gap-10 border-t border-design-dark-border pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* 站内导航 */}
          <nav aria-label="Footer">
            <p className="text-label font-semibold uppercase text-design-dark-text-muted">
              Site
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-design-dark-text-secondary transition-colors duration-base hover:text-design-dark-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 社交账号：与导航面板、JSON-LD 共用 SOCIAL_LINKS */}
          <div>
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
                    className="text-small text-design-dark-text-secondary transition-colors duration-base hover:text-design-dark-text-primary"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 定位信息 */}
          <div>
            <p className="text-label font-semibold uppercase text-design-dark-text-muted">
              Based in
            </p>
            <p className="mt-4 text-small text-design-dark-text-secondary">
              {SITE_LOCATION}
              <br />
              Working internationally
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-design-dark-border pt-6 text-small text-design-dark-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE_AUTHOR} — {SITE_ROLE}
          </p>
          <p>{SITE_DOMAIN}</p>
        </div>
      </div>
    </footer>
  );
}
