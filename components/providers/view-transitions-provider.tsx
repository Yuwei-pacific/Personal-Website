"use client";

import { usePathname } from "next/navigation";
import { ViewTransitions } from "next-view-transitions";
import { useEffect } from "react";

export function AppViewTransitions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Disable view transitions on swipe back (popstate) to prevent black screen freeze in Safari/Chrome
  useEffect(() => {
    if (typeof window === "undefined" || !("startViewTransition" in document)) return;

    let isPopState = false;
    const onPopState = () => {
      isPopState = true;
      setTimeout(() => {
        isPopState = false;
      }, 0);
    };

    window.addEventListener("popstate", onPopState, { capture: true });

    const originalStartViewTransition = document.startViewTransition.bind(document);
    // @ts-expect-error: Document.startViewTransition is not fully typed
    document.startViewTransition = (callback: () => Promise<void>) => {
      if (isPopState) {
        // Skip view transition during popstate, just run the callback
        const promise = Promise.resolve(callback()).then(() => {});
        return {
          ready: promise,
          updateCallbackDone: promise,
          finished: promise,
          skipTransition: () => {}
        };
      }
      return originalStartViewTransition(callback);
    };

    return () => {
      window.removeEventListener("popstate", onPopState, { capture: true });
      document.startViewTransition = originalStartViewTransition;
    };
  }, []);

  // Disable view transitions inside Sanity Studio to prevent prop leakage errors
  if (pathname?.startsWith("/studio")) {
    return <>{children}</>;
  }

  return <ViewTransitions>{children}</ViewTransitions>;
}
