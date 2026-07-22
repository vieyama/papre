"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { locales, type Locale } from "@/i18n/config";
import { localeHref, stripLocale } from "@/i18n/paths";
import { cn } from "@/lib/utils";

const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  id: "ID",
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale: currentLocale, path } = stripLocale(pathname);

  return (
    <div className="flex items-center gap-1 text-sm">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={localeHref(path, locale)}
          className={cn(
            "rounded-md px-2 py-1 transition-colors",
            locale === currentLocale
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LOCALE_LABEL[locale]}
        </Link>
      ))}
    </div>
  );
}
