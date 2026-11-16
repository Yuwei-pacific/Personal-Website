export const locales = ["it", "en"] as const;

export type Locale = (typeof locales)[number];

/** 内容的默认语言（CMS 回退、404 兜底）。访客打开不带前缀的地址时去哪种语言不由它定，见 preferredLocale */
export const defaultLocale: Locale = "it";

export const localeLabels: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
};

/** 访客的浏览器语言里没有本站支持的语言时用哪种：英语（会意大利语的人，浏览器基本就是意大利语） */
export const fallbackLocale: Locale = "en";

/** 记住访客在菜单里手动选的语言。只影响不带语言前缀的地址跳到哪，带前缀的地址照原样打开 */
export const LOCALE_COOKIE = "locale";

/**
 * 按浏览器的 Accept-Language 挑语言：取访客排得最靠前、本站又支持的那一种（"it-IT" 算 it）；
 * 一种都不支持，或者没有这个头（爬虫），用 fallbackLocale
 */
export function preferredLocale(acceptLanguage: string | null | undefined): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { locale: tag.toLowerCase().split("-")[0], weight: Number.isFinite(weight) ? weight : 0 };
    })
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  return ranked.map((entry) => entry.locale).find(isLocale) ?? fallbackLocale;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}
