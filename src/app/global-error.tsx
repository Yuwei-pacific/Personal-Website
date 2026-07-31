"use client";

// 根布局自身崩溃时的兜底：此时 layout（含字体变量与 providers）已不可用，
// 所以必须自带 <html>/<body>，且只用内联样式，不依赖任何全局 CSS。
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "1rem",
          padding: "0 1.5rem",
          background: "#ffffff",
          color: "#171717",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#737373",
          }}
        >
          Something went wrong
        </p>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 600 }}>
          This page failed to load
        </h1>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: 0,
            background: "none",
            border: 0,
            borderBottom: "2px solid currentColor",
            font: "inherit",
            fontWeight: 600,
            cursor: "pointer",
            color: "inherit",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
