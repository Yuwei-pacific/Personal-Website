"use client";

import { usePathname } from "next/navigation";
import { ViewTransitions } from "next-view-transitions";

export function AppViewTransitions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Disable view transitions inside Sanity Studio to prevent prop leakage errors
  if (pathname?.startsWith("/studio")) {
    return <>{children}</>;
  }

  return <ViewTransitions>{children}</ViewTransitions>;
}
