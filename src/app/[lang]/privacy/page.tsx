import type { Metadata } from "next";
import Link from "next/link";
import { getLegalContent } from "@/i18n/legal";
import { LegalDocumentView } from "@/components/legal-document";
import { localeHref } from "@/i18n/paths";
import { defaultLocale } from "@/i18n/config";
import { hasLocale } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const legal = await getLegalContent(locale);

  return {
    title: legal.privacy.title,
    description: `${legal.privacy.title} for Papre.`,
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const legal = await getLegalContent(locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-8">
      <Link
        href={localeHref("/", locale)}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {legal.backToPapre}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        {legal.privacy.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {legal.lastUpdatedLabel}: {legal.privacy.lastUpdated}
      </p>

      <LegalDocumentView doc={legal.privacy} />
    </div>
  );
}
