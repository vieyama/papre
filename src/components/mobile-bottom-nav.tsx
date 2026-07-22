"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  BookHeart,
  CalendarDaysIcon,
  CircleUserRound,
  FileTextIcon,
  HomeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref, stripLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const { path } = stripLocale(pathname);

  const navItems = [
    { href: "/home", label: dict.nav.home, icon: HomeIcon },
    { href: "/book", label: dict.nav.book, icon: BookHeart },
    { href: "/calendar", label: dict.nav.calendar, icon: CalendarDaysIcon },
    { href: "/pages", label: dict.nav.pages, icon: FileTextIcon },
    { href: "/account", label: dict.nav.account, icon: CircleUserRound },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center border-t border-border bg-background md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = path === href || path.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={localeHref(href, lang)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
