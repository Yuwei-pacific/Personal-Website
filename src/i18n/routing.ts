import { defaultLocale, isLocale, type Locale } from "./config";

export function localizedPath(locale: Locale, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithoutLocale = removeLocalePrefix(normalizedPath);

  return pathWithoutLocale === "/"
    ? `/${locale}`
    : `/${locale}${pathWithoutLocale}`;
}

export function removeLocalePrefix(pathname: string) {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    const path = `/${segments.slice(2).join("/")}`;
    return path === "/" ? "/" : path;
  }

  return pathname || "/";
}

export function replaceLocale(pathname: string, locale: Locale) {
  return localizedPath(locale, pathname || `/${defaultLocale}`);
}
