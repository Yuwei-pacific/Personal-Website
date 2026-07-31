"use client";

// 路由级错误边界：渲染期异常不再冒到 Next 默认错误页，
// 保持站点视觉并给出重试入口。（数据请求本身已在 page 层 try/catch。）
import { useEffect } from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dictionary = getDictionary(locale);

  useEffect(() => {
    console.error("Route error", error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <Navbar locale={locale} dictionary={dictionary} />
      <main
        id="main-content"
        className="mx-auto flex min-h-[70vh] w-full max-w-content flex-col items-start justify-center gap-4 px-container sm:px-container-sm"
      >
        <p className="text-label font-semibold uppercase text-design-light-text-muted">
          {dictionary.errors.errorEyebrow}
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-design-light-text-primary sm:text-section">
          {dictionary.errors.errorTitle}
        </h1>
        <p className="max-w-xl text-body text-design-light-text-secondary">
          {dictionary.errors.errorBody}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={reset}
            className="border-b-2 border-current text-small font-semibold text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          >
            {dictionary.errors.retry}
          </button>
          <Link
            href={localizedPath(locale)}
            className="text-small font-medium text-design-light-text-secondary underline underline-offset-4 transition-colors duration-base hover:text-design-light-text-primary"
          >
            {dictionary.errors.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
