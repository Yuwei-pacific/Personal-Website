// 站点级常量的唯一出处。
// 换域名、改简介、加社交账号都只动这里或 i18n 字典 —— metadata、JSON-LD、
// sitemap、robots、footer、导航面板全部从同一份数据读取。

import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

export const SITE_URL = "https://www.yuweidesign.com";

/** 展示用的域名（去掉协议，用于 footer / OG 图这类只读文本） */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

export const SITE_NAME = "Yuwei Design";

export const SITE_AUTHOR = "Yuwei Li";

export const SITE_TITLE =
  "Yuwei Li | Communication Designer & Frontend Developer";

export const SITE_ROLE = "Communication Designer & Frontend Developer";

export const SITE_EMAIL = "yuweidesign@outlook.com";

export const SITE_LOCATIONS: Record<Locale, string> = {
  it: "Milano, Italia",
  en: "Milan, Italy",
};

/** JSON-LD 的 PostalAddress.addressLocality（城市名单独一份，展示串不可直接拆） */
export const SITE_ADDRESS_LOCALITY: Record<Locale, string> = {
  it: "Milano",
  en: "Milan",
};

export const SITE_COUNTRY_CODE = "IT";

/** X 账号：twitter:creator 与 sameAs 共用同一份，避免再次写错 */
export const SITE_TWITTER_HANDLE = "@Li_Yuwei_";

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  it: "it_IT",
  en: "en_US",
};

export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/Yuwei-pacific" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yuwei081/" },
  { label: "Instagram", href: "https://www.instagram.com/yuwei081/" },
  { label: "X", href: "https://x.com/Li_Yuwei_" },
] as const;

/** 相对路径 → 绝对 URL（sitemap、canonical、JSON-LD 用） */
export const absoluteUrl = (path = "/") => new URL(path, SITE_URL).toString();

export const localizedAbsoluteUrl = (locale: Locale, path = "/") =>
  absoluteUrl(localizedPath(locale, path));

export function languageAlternates(path = "/") {
  return {
    it: localizedAbsoluteUrl("it", path),
    en: localizedAbsoluteUrl("en", path),
    "x-default": localizedAbsoluteUrl("it", path),
  };
}

export function getSiteMetadata(locale: Locale) {
  const dictionary = getDictionary(locale);

  return {
    title: dictionary.metadata.siteTitle,
    description: dictionary.metadata.siteDescription,
    keywords: dictionary.metadata.keywords,
    location: SITE_LOCATIONS[locale],
    openGraphLocale: OPEN_GRAPH_LOCALES[locale],
    alternateOpenGraphLocale: OPEN_GRAPH_LOCALES[locale === "it" ? "en" : "it"],
  };
}
