"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/#home", id: "home" },
  { label: "About", href: "/#about", id: "about" },
  { label: "Work", href: "/#work", id: "work" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  // Close mobile menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (open) setOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);

  // Track which section is currently in view to highlight the active nav item
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 sm:px-6">
      {/* 悬浮导航：白色实色背景 + 阴影，圆角矩形，无论叠在浅色还是深色区块上方都保持清晰可读 */}
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-panel border border-design-light-border/60 bg-design-light-surface/95 px-6 py-4 shadow-nav backdrop-blur-xl dark:border-design-dark-border dark:bg-design-dark-surface/95">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 transition-transform duration-base hover:scale-emphasis">
          <Image
            src="/Logo.svg"
            alt="Yuwei Li"
            width={40}
            height={40}
            className="h-8 w-8"
            priority
          />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-design-light-text-primary dark:text-design-dark-text-primary">Yuwei Li</span>
        </Link>

        {/* Right: Desktop Nav + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={cn(
                    "rounded-tag px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] transition-colors duration-base",
                    isActive
                      ? "bg-design-light-active text-design-light-text-primary dark:bg-design-dark-active/10 dark:text-design-dark-text-primary"
                      : "text-design-light-text-secondary hover:bg-design-light-hover hover:text-design-light-text-primary dark:text-design-dark-text-muted dark:hover:bg-design-dark-hover/10 dark:hover:text-design-dark-text-primary"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center text-design-light-text-primary dark:text-design-dark-text-primary md:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown：保留实色背景以确保菜单内容可读 */}
      <div className={`absolute left-4 right-4 mt-2 overflow-hidden rounded-panel border border-design-light-border/60 bg-design-light-surface/90 backdrop-blur-xl transition-all duration-base ease-standard dark:border-design-dark-border dark:bg-design-dark-bg/90 md:hidden ${open ? "max-h-64 opacity-100 shadow-hover" : "pointer-events-none max-h-0 opacity-0"}`}>
        <nav className="flex flex-col p-4">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  "rounded-button px-4 py-3 text-small font-medium uppercase tracking-[0.2em] transition-colors duration-base",
                  isActive
                    ? "bg-design-light-active text-design-light-text-primary dark:bg-design-dark-active/10 dark:text-design-dark-text-primary"
                    : "text-design-light-text-secondary hover:bg-design-light-hover hover:text-design-light-text-primary dark:text-design-dark-text-muted dark:hover:bg-design-dark-hover/10 dark:hover:text-design-dark-text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
