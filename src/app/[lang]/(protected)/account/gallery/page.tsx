import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountGallery } from "@/components/account-gallery";
import { BackButton } from "@/components/back-button";
import { defaultLocale } from "@/i18n/config";
import { getDictionary, hasLocale } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/paths";
import { getGalleryAssets } from "@/services/gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return { title: dict.gallery.metaTitle, description: dict.gallery.description };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const session = await auth();

  if (!session?.user?.id) redirect(localeHref("/login", locale));

  const assets = await getGalleryAssets(session.user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
      <BackButton />
      <header className="mb-7 mt-5 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.gallery.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.gallery.description}</p>
      </header>
      <AccountGallery assets={assets} />
    </div>
  );
}
