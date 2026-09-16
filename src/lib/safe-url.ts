// tel: 与 schema 的 Rule.uri({ scheme: [... "tel"] }) 保持一致，
// 否则编辑填写的电话链接会被渲染成不可点的纯文本。
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function getSafeHref(value?: string | null) {
  const href = value?.trim();
  if (!href) return null;

  if (href.startsWith("/") && !href.startsWith("//")) {
    // 反斜杠会被浏览器按 / 规范化，所以 `/\evil.com` 虽以单个 / 开头，
    // 实际会被解析到站外。相对路径分支必须把它挡掉。
    return href.includes("\\") ? null : href;
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
