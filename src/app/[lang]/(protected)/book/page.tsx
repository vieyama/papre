import { auth } from "@/auth";
import { BookLibrary } from "@/components/book/book-library";
import { getBookCollectionsByUserId } from "@/services/book";
import { getWorkspacesByUserId } from "@/services/workspace";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
    title: dict.book.metaTitleLibrary,
    description: dict.book.metaDescriptionLibrary,
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(localeHref("/login", locale));
  }

  const [workspaces, collections] = await Promise.all([
    getWorkspacesByUserId(session.user.id),
    getBookCollectionsByUserId(session.user.id),
  ]);

  return (
    <BookLibrary
      workspaces={workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        icon: workspace.icon,
        currentUserRole: workspace.currentUserRole,
      }))}
      collections={collections}
    />
  );
}
