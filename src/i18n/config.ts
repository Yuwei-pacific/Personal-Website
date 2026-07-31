export const locales = ["it", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

export const localeLabels: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}
