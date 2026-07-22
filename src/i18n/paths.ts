import { defaultLocale, locales, type Locale } from "./config";

export const PROTECTED_PATHS = ["/home", "/book", "/calendar", "/account", "/pages"];

export function localeHref(path: string, locale: string): string {
  if (locale === defaultLocale) return path;

  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const secondSegment = pathname.split("/")[1];

  if (
    secondSegment &&
    locales.includes(secondSegment as Locale) &&
    secondSegment !== defaultLocale
  ) {
    const rest = pathname.slice(1 + secondSegment.length);
    return { locale: secondSegment as Locale, path: rest === "" ? "/" : rest };
  }

  return { locale: defaultLocale, path: pathname };
}
