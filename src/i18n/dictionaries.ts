import "server-only";

import { locales, type Locale } from "./config";
import en from "./dictionaries/en";
import id from "./dictionaries/id";

const dictionaries = { en, id };

export function hasLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

export async function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
