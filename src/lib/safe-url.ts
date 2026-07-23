const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function getSafeHref(value?: string | null) {
  const href = value?.trim();
  if (!href) return null;

  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  try {
    const url = new URL(href);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function getExternalLinkProps(href: string) {
  return /^https?:\/\//i.test(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}
