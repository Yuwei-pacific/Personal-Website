import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const hslVar = (name: string) => `hsl(var(${name}) / <alpha-value>)`;

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 全局默认值：body 底色/文字、全站描边、焦点环
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // 分区色板：浅色区用 design-light-*，深色区用 design-dark-*
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
            "hover-border": hslVar("--color-hover-border-dark"),
          },
        },
      },
      spacing: {
        // 页面级大区块之间的呼吸
        section: "var(--space-section-y)",
        "section-sm": "var(--space-section-y-sm)",
        // 区块内部的内边距（详情页深色面板、页脚）
        panel: "var(--space-panel-y)",
        "panel-sm": "var(--space-panel-y-sm)",
        container: "var(--space-container-x)",
        "container-sm": "var(--space-container-x-sm)",
        card: "var(--space-card)",
        "gap-section": "var(--space-gap-section)",
        "gap-section-sm": "var(--space-gap-section-sm)",
        stack: "var(--space-stack)",
      },
      maxWidth: {
        // 内容栏 measure：页面主体、页脚、详情页正文共用
        content: "var(--layout-content)",
      },
      zIndex: {
        // 跨组件的全局浮层契约（区块内部层叠仍用 Tailwind 默认档位）
        nav: "var(--z-nav)",
        "nav-logo": "var(--z-nav-logo)",
        cursor: "var(--z-cursor)",
        "skip-link": "var(--z-skip-link)",
      },
      // 全站方角：把 Tailwind 的通用圆角档位归零，视觉决策统一走下面的语义 token。
      // `full` 不归零 —— 圆形（头像、状态点、图标按钮）是形状而非圆角风格，
      // 归零会让 rounded-full 静默失效，逼出 rounded-[50%] 这类逃逸写法。
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        tag: "var(--radius-tag)",
        media: "var(--radius-media)",
        panel: "var(--radius-panel)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        hover: "var(--shadow-hover)",
      },
      letterSpacing: {
        display: "var(--tracking-display)",
      },
      fontSize: {
        display: ["3.75rem", { lineHeight: "1.1", letterSpacing: "0" }],
        "display-sm": ["3rem", { lineHeight: "1.15", letterSpacing: "0" }],
        section: ["2.25rem", { lineHeight: "1.15", letterSpacing: "0" }],
        // section 引言：紧跟大标题的那句导语
        lead: ["1.65rem", { lineHeight: "1.18", letterSpacing: "0" }],
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
        "design-out": "var(--motion-ease-out)",
      },
      scale: {
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
        "bounce-sine": {
          "0%, 100%": { transform: "translateY(12px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        marquee: "marquee 23s linear infinite",
        "bounce-sine": "bounce-sine 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
