"use client";

// 本地化 404 页面：从当前 pathname 读取 locale，配合 notFound() 返回真正的 404。
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

export default function NotFound() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dictionary = getDictionary(locale);

  return (
    <div className="min-h-screen">
      <Navbar locale={locale} dictionary={dictionary} />
      <main id="main-content" className="mx-auto flex min-h-[70vh] w-full max-w-content flex-col items-start justify-center gap-4 px-container sm:px-container-sm">
        <p className="text-label font-semibold uppercase text-design-light-text-muted">404</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-design-light-text-primary sm:text-section">
          {dictionary.errors.notFoundTitle}
        </h1>
        <p className="max-w-xl text-body text-design-light-text-secondary">
          {dictionary.errors.notFoundBody}
        </p>
        <Link
          href={localizedPath(locale)}
          className="mt-2 text-small font-medium text-design-light-text-secondary underline underline-offset-4 transition-colors duration-base hover:text-design-light-text-primary"
        >
          {dictionary.errors.backHome}
        </Link>
      </main>
    </div>
  );
}
