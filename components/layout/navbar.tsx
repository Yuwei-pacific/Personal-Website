"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navItems = [
  { label: "[ Home ]", href: "/#home" },
  { label: "[ About ]", href: "/#about" },
  { label: "[ Work ]", href: "/#work" },
  { label: "[ Contact ]", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8 md:px-12">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Logo.svg"
            alt="Your logo"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Yuwei Li</span>
            <span className="text-xs text-muted-foreground">Personal Portfolio</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500/30"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            Menu
          </button>
          {open ? (
            <nav className="absolute left-0 top-full z-40 w-full border-b border-neutral-200 bg-white/95 px-4 py-3 text-sm text-neutral-800 shadow-sm backdrop-blur animate-mobile-menu">
              <div className="flex flex-col divide-y divide-neutral-200 text-right">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="py-2 transition-colors hover:text-neutral-950 text-right"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <style jsx>{`
                @keyframes mobileMenu {
                  from {
                    opacity: 0;
                    transform: translateY(-6px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .animate-mobile-menu {
                  animation: mobileMenu 180ms ease-out;
                }
              `}</style>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
