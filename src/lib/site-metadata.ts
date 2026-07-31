// 站点级常量的唯一出处。
// 换域名、改简介、加社交账号都只动这个文件 —— metadata、JSON-LD、sitemap、
// robots、footer、导航面板全部从这里取值，不再各自硬编码。

export const SITE_URL = "https://www.yuweidesign.com";

/** 展示用的域名（去掉协议，用于 footer / OG 图这类只读文本） */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

export const SITE_NAME = "Yuwei Design";

export const SITE_AUTHOR = "Yuwei Li";

export const SITE_TITLE =
  "Yuwei Li | Communication Designer & Frontend Developer";

export const SITE_ROLE = "Communication Designer & Frontend Developer";

export const SITE_DESCRIPTION =
  "Milan-based Communication Designer & Frontend Developer creating visual identities, digital interfaces and custom websites for studios and organisations.";

export const SITE_EMAIL = "yuweidesign@outlook.com";

export const SITE_LOCATION = "Milan, Italy";

export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/Yuwei-pacific" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yuwei081/" },
  { label: "Instagram", href: "https://www.instagram.com/yuwei081/" },
] as const;

/** 相对路径 → 绝对 URL（sitemap、canonical、JSON-LD 用） */
export const absoluteUrl = (path = "/") => new URL(path, SITE_URL).toString();
