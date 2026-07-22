import "server-only";

import type { Locale } from "../config";
import en from "./en";
import id from "./id";

const legalContent = { en, id };

export async function getLegalContent(locale: Locale) {
  return legalContent[locale];
}
