"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

import { locales, type Locale } from "@/i18n/config";
import { localeHref, stripLocale } from "@/i18n/paths";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  id: "ID",
};

const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const { locale: currentLocale, path } = stripLocale(pathname);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("text-muted-foreground", className)}
        >
          <Languages />
          {LOCALE_LABEL[currentLocale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link
              href={localeHref(path, locale)}
              className={cn(
                locale === currentLocale && "font-medium text-foreground",
              )}
            >
              {LOCALE_NAME[locale]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
