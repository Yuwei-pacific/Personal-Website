import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

import { getExternalLinkProps, getSafeHref } from "@/lib/safe-url";

const portableComponents: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => (
      <h3 className="mt-14 text-2xl font-semibold leading-tight text-design-dark-text-primary first:mt-0 sm:text-3xl">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mt-10 text-xl font-semibold leading-tight text-design-dark-text-primary first:mt-0 sm:text-2xl">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mt-5 whitespace-pre-line text-base leading-relaxed first:mt-0 sm:text-lg sm:leading-8">
        {children}
      </p>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-design-dark-text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => {
      const href = getSafeHref((value as { href?: string })?.href);
      if (!href) return <>{children}</>;
      return (
        <a href={href} {...getExternalLinkProps(href)} className="underline underline-offset-4 transition-colors duration-base hover:text-design-dark-text-primary">
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-3 pl-6 text-base leading-relaxed first:mt-0 sm:text-lg sm:leading-8">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-3 pl-6 text-base leading-relaxed first:mt-0 sm:text-lg sm:leading-8">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
};

export function ProjectRichText({ blocks }: { blocks: PortableTextBlock[] }) {
  if (!blocks.length) return null;

  return <PortableText value={blocks} components={portableComponents} />;
}
