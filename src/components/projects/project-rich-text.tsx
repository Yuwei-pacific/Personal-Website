import {
  PortableText,
  type PortableTextBlock,
  type PortableTextReactComponents,
} from "next-sanity";

import { getExternalLinkProps, getSafeHref } from "@/lib/safe-url";

type ProjectRichTextTone = "dark" | "light";
type ProjectRichTextScale = "default" | "compact";

const toneStyles = {
  dark: {
    primary: "text-design-dark-text-primary",
    border: "border-design-dark-border-strong",
    hover: "hover:text-design-dark-text-primary",
  },
  light: {
    primary: "text-design-light-text-primary",
    border: "border-design-light-border-strong",
    hover: "hover:text-design-light-text-primary",
  },
} as const;

const scaleStyles = {
  default: {
    h2: "mt-14 text-2xl sm:text-3xl",
    h3: "mt-10 text-xl sm:text-2xl",
    normal: "mt-5 text-base leading-relaxed sm:text-lg sm:leading-8",
    blockquote: "mt-6 pl-5 text-base leading-relaxed sm:text-lg sm:leading-8",
    list: "mt-5 space-y-3 pl-6 text-base leading-relaxed sm:text-lg sm:leading-8",
  },
  compact: {
    h2: "mt-8 text-base sm:text-lg",
    h3: "mt-7 text-small sm:text-base",
    normal: "mt-3 text-xs leading-5 sm:text-small sm:leading-6",
    blockquote: "mt-4 pl-4 text-xs leading-5 sm:text-small sm:leading-6",
    list: "mt-3 space-y-2 pl-5 text-xs leading-5 sm:text-small sm:leading-6",
  },
} as const;

function createPortableComponents(
  tone: ProjectRichTextTone,
  scale: ProjectRichTextScale,
): Partial<PortableTextReactComponents> {
  const t = toneStyles[tone];
  const s = scaleStyles[scale];

  return {
    block: {
      // 旧内容兼容：Studio 已不再提供 H2，但已保存的数据仍可安全渲染。
      h2: ({ children }) => (
        <h3 className={`font-semibold leading-tight first:mt-0 ${s.h2} ${t.primary}`}>
          {children}
        </h3>
      ),
      h3: ({ children }) => (
        <h3 className={`font-semibold leading-tight first:mt-0 ${s.h3} ${t.primary}`}>
          {children}
        </h3>
      ),
      normal: ({ children }) => (
        <p className={`whitespace-pre-line first:mt-0 ${s.normal}`}>
          {children}
        </p>
      ),
      // 富文本里的引用块。Portable Text 的默认实现只渲染裸 <blockquote>，
      // 不加样式就和普通段落混在一起——必须自己接管。
      // 整段独立的引言建议改用 quoteSection 模块，这里是为正文内嵌引用保底。
      blockquote: ({ children }) => (
        <blockquote
          className={`border-l-2 italic first:mt-0 ${s.blockquote} ${t.border} ${t.primary}`}
        >
          {children}
        </blockquote>
      ),
    },
    marks: {
      strong: ({ children }) => <strong className={`font-semibold ${t.primary}`}>{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      link: ({ children, value }) => {
        const href = getSafeHref((value as { href?: string })?.href);
        if (!href) return <>{children}</>;
        return (
          <a
            href={href}
            {...getExternalLinkProps(href)}
            className={`underline underline-offset-4 transition-colors duration-base ${t.hover}`}
          >
            {children}
          </a>
        );
      },
    },
    list: {
      bullet: ({ children }) => (
        <ul className={`list-disc first:mt-0 ${s.list}`}>
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className={`list-decimal first:mt-0 ${s.list}`}>
          {children}
        </ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
  };
}

const portableComponents = {
  default: {
    dark: createPortableComponents("dark", "default"),
    light: createPortableComponents("light", "default"),
  },
  compact: {
    dark: createPortableComponents("dark", "compact"),
    light: createPortableComponents("light", "compact"),
  },
} as const;

export function ProjectRichText({
  blocks,
  tone = "dark",
  scale = "default",
}: {
  blocks: PortableTextBlock[];
  tone?: ProjectRichTextTone;
  scale?: ProjectRichTextScale;
}) {
  if (!blocks.length) return null;

  return <PortableText value={blocks} components={portableComponents[scale][tone]} />;
}
