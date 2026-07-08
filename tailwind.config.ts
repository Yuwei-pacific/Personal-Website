import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const hslVar = (name: string) => `hsl(var(${name}) / <alpha-value>)`;

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        design: {
          light: {
            bg: hslVar("--color-bg-light"),
            surface: hslVar("--color-surface-light"),
            raised: hslVar("--color-surface-raised-light"),
            text: {
              primary: hslVar("--color-text-primary-light"),
              secondary: hslVar("--color-text-secondary-light"),
              muted: hslVar("--color-text-muted-light"),
            },
            border: hslVar("--color-border-light"),
            "border-strong": hslVar("--color-border-strong-light"),
            accent: hslVar("--color-accent-light"),
            hover: hslVar("--color-hover-bg-light"),
            "hover-border": hslVar("--color-hover-border-light"),
            active: hslVar("--color-active-light"),
          },
          dark: {
            bg: hslVar("--color-bg-dark"),
            surface: hslVar("--color-surface-dark"),
            elevated: hslVar("--color-surface-elevated-dark"),
            text: {
              primary: hslVar("--color-text-primary-dark"),
              secondary: hslVar("--color-text-secondary-dark"),
              muted: hslVar("--color-text-muted-dark"),
            },
            border: hslVar("--color-border-dark"),
            "border-strong": hslVar("--color-border-strong-dark"),
            accent: hslVar("--color-accent-dark"),
            hover: hslVar("--color-hover-bg-dark"),
            "hover-border": hslVar("--color-hover-border-dark"),
            active: hslVar("--color-active-dark"),
          },
        },
      },
      spacing: {
        section: "var(--space-section-y)",
        "section-sm": "var(--space-section-y-sm)",
        container: "var(--space-container-x)",
        "container-sm": "var(--space-container-x-sm)",
        card: "var(--space-card)",
        "card-lg": "var(--space-card-lg)",
        "gap-section": "var(--space-gap-section)",
        "gap-section-sm": "var(--space-gap-section-sm)",
        "gap-card": "var(--space-gap-card)",
        "gap-inline": "var(--space-gap-inline)",
        stack: "var(--space-stack)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        tag: "var(--radius-tag)",
        media: "var(--radius-media)",
        panel: "var(--radius-panel)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        hover: "var(--shadow-hover)",
        nav: "var(--shadow-nav)",
      },
      fontSize: {
        display: ["3.75rem", { lineHeight: "1.1", letterSpacing: "0" }],
        "display-sm": ["3rem", { lineHeight: "1.15", letterSpacing: "0" }],
        section: ["2.25rem", { lineHeight: "1.15", letterSpacing: "0" }],
        card: ["1.5rem", { lineHeight: "1.25", letterSpacing: "0" }],
        body: ["1rem", { lineHeight: "1.75", letterSpacing: "0" }],
        small: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0" }],
        label: ["0.75rem", { lineHeight: "1.35", letterSpacing: "0.3em" }],
      },
      transitionDuration: {
        fast: "var(--motion-duration-fast)",
        base: "var(--motion-duration-base)",
        slow: "var(--motion-duration-slow)",
        media: "var(--motion-duration-media)",
      },
      transitionTimingFunction: {
        standard: "var(--motion-ease-standard)",
        "design-out": "var(--motion-ease-out)",
      },
      scale: {
        hover: "var(--motion-scale-hover)",
        emphasis: "var(--motion-scale-emphasis)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "bounce-sine": {
          "0%, 100%": { transform: "translateY(12px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        marquee: "marquee 46s linear infinite",
        "marquee-vertical": "marquee-vertical 30s linear infinite",
        float: "float 3s ease-in-out infinite",
        "bounce-sine": "bounce-sine 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
