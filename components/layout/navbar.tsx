"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Work", href: "/#work" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  // Close mobile menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (open) setOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="w-full border-b border-black/5 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/60">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-12">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <Image
              src="/Logo.svg"
              alt="Yuwei Li"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Yuwei Li</span>
              <span className="text-xs text-muted-foreground dark:text-neutral-400">Personal Portfolio</span>
            </div>
          </Link>

          {/* Center: Desktop Nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-black/5 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: CTA & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/guitar-fretboard-trainer"
              className="hidden rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-neutral-800 hover:shadow-md dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 sm:block"
            >
              Guitar Trainer
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-neutral-800 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:hidden"
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
      </div>

      {/* Mobile Nav Dropdown */}
      <div className={`absolute left-4 right-4 mt-2 overflow-hidden rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-white/10 dark:bg-neutral-950/80 md:hidden ${open ? "max-h-64 opacity-100 shadow-xl" : "pointer-events-none max-h-0 opacity-0"}`}>
        <nav className="flex flex-col p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-neutral-200 dark:bg-neutral-800" />
          <Link
            href="/guitar-fretboard-trainer"
            className="rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            onClick={() => setOpen(false)}
          >
            Guitar Trainer
          </Link>
        </nav>
      </div>
    </header>
  );
}
