import type { Locale } from "@/i18n/config";

function intlLocale(locale: Locale) {
  return locale === "id" ? "id-ID" : "en-US";
}

export function formatShortDate(value: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
