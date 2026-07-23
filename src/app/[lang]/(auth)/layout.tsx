import type { Metadata } from "next";
import Link from "next/link";
import { PapreGlyph } from "@/components/brand-glyph";
import { getDictionary, hasLocale } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/paths";
import { defaultLocale } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f172a] p-10 text-white lg:flex">
        <Link href={localeHref("/", locale)} className="flex items-center gap-2 text-sm font-medium">
          <PapreGlyph className="size-6" />
          Papre
        </Link>
        <div className="max-w-sm">
          <p className="text-3xl font-semibold tracking-tight text-balance">
            {dict.authLayout.tagline}
          </p>
          <p className="mt-4 text-sm text-white/60">
            {dict.authLayout.quote}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Link
            href={localeHref("/", locale)}
            className="flex items-center gap-2 text-sm font-medium lg:hidden"
          >
            <PapreGlyph className="size-6 text-foreground" />
            Papre
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
