import Link from "next/link";
import Image from "next/image";

const navItems = [
  { label: "[ Home ]", href: "/about#home" },
  { label: "[ About ]", href: "/about#about" },
  { label: "[ Work ]", href: "/about#work" },
  { label: "[ Contact ]", href: "/contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-16 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg" // or /logo.png
            alt="Your logo"
            width={42}
            height={42}
            className="h-9 w-9 rounded-full"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Yuwei Li</span>
            <span className="text-xs text-muted-foreground">
              Personal Portfolio
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground sm:flex">
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

      </div>
    </header>
  );
}
