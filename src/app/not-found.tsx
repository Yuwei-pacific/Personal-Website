// 全局 404 页面：配合 notFound() 返回真正的 404 状态码，同时保持站点视觉风格
import { Link } from "next-view-transitions";
import { Navbar } from "@/components/layout/navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-start justify-center gap-4 px-container sm:px-container-sm">
        <p className="text-label font-semibold uppercase text-design-light-text-muted">404</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-design-light-text-primary sm:text-section">
          Page not found
        </h1>
        <p className="max-w-xl text-body text-design-light-text-secondary">
          The page you are looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <Link
          href="/"
          className="mt-2 text-small font-medium text-design-light-text-secondary underline underline-offset-4 transition-colors duration-base hover:text-design-light-text-primary"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
