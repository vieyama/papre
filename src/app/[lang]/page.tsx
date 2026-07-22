import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  DownloadIcon,
  FolderIcon,
  LibraryBigIcon,
  LockKeyholeIcon,
  UsersIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PapreGlyph } from "@/components/brand-glyph";
import { getDictionary, hasLocale } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/paths";
import { defaultLocale } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/language-switcher";

const FEATURE_ICONS = [
  FolderIcon,
  CalendarDaysIcon,
  LibraryBigIcon,
  LockKeyholeIcon,
  UsersIcon,
  DownloadIcon,
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    description: dict.landing.metaDescription,
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const session = await auth();

  if (session?.user?.id) {
    redirect(localeHref("/home", locale));
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 md:px-8">
        <Link href={localeHref("/", locale)} className="flex items-center gap-2 text-sm font-medium">
          <PapreGlyph className="size-6 text-foreground" />
          Papre
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost">
            <Link href={localeHref("/login", locale)}>{dict.landing.login}</Link>
          </Button>
          <Button asChild>
            <Link href={localeHref("/signup", locale)}>{dict.landing.signup}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center md:px-8 md:py-24">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {dict.landing.heroTitle}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground text-balance">
            {dict.landing.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href={localeHref("/signup", locale)}>
                {dict.landing.getStarted}
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={localeHref("/login", locale)}>{dict.landing.login}</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16 md:px-8 md:pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dict.landing.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index];
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <h2 className="mt-4 font-semibold tracking-tight">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {dict.landing.howItWorksTitle}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {dict.landing.howItWorksSubtitle}
              </p>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {dict.landing.steps.map((item, index) => (
                <div key={item.title}>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {dict.landing.faqTitle}
          </h2>
          <div className="mt-8 divide-y rounded-xl border">
            {dict.landing.faqs.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                  {faq.question}
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-16 text-center md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {dict.landing.ctaTitle}
            </h2>
            <p className="max-w-md text-muted-foreground">
              {dict.landing.ctaDescription}
            </p>
            <Button asChild size="lg" className="mt-2">
              <Link href={localeHref("/signup", locale)}>
                {dict.landing.ctaButton}
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row md:px-8">
        <p>&copy; {new Date().getFullYear()} Papre.</p>
        <div className="flex items-center gap-4">
          <Link href={localeHref("/terms", locale)} className="hover:underline">
            {dict.landing.footerTerms}
          </Link>
          <Link href={localeHref("/privacy", locale)} className="hover:underline">
            {dict.landing.footerPrivacy}
          </Link>
        </div>
      </footer>
    </div>
  );
}
