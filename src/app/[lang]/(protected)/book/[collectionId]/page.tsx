import { auth } from "@/auth";
import { BookCollectionDetail } from "@/components/book/book-collection-detail";
import { getBookCollectionDetail } from "@/services/book";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDictionary, hasLocale } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/paths";
import { defaultLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    title: dict.book.metaTitleCollection,
    description: dict.book.metaDescriptionCollection,
  };
}

export default async function BookCollectionPage({
  params,
}: {
  params: Promise<{ lang: string; collectionId: string }>;
}) {
  const { lang, collectionId } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(localeHref("/login", locale));
  }

  const collection = await getBookCollectionDetail(
    session.user.id,
    collectionId,
  );

  if (!collection) {
    notFound();
  }

  return <BookCollectionDetail collection={collection} />;
}
