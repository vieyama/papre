import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getBookReaderVolume } from "@/services/book";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PDFViewer } from "@/components/pdf-viewer";
import { NodeContentEditor } from "@/components/node-content-editor";
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
    title: dict.book.metaTitleVolume,
    description: dict.book.metaDescriptionVolume,
  };
}

export default async function BookVolumePage({
  params,
}: {
  params: Promise<{ lang: string; collectionId: string; volumeId: string }>;
}) {
  const { lang, collectionId, volumeId } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const session = await auth();

  if (!session?.user?.id) {
    redirect(localeHref("/login", locale));
  }

  const volume = await getBookReaderVolume(
    session.user.id,
    collectionId,
    volumeId,
  );

  if (!volume) {
    notFound();
  }

  return (
    <div
      className={`mx-auto flex w-full max-w-7xl flex-col px-4 py-1 sm:px-8 ${
        volume.kind === "pdf"
          ? "md:h-[calc(100dvh-4.5rem)] md:overflow-hidden"
          : ""
      }`}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={localeHref(`/book/${volume.collectionId}`, locale)}>
            <ArrowLeftIcon />
            {dict.common.back}
          </Link>
        </Button>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {volume.collectionTitle}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {volume.title}
          </h1>
        </div>
      </div>

      {volume.kind === "pdf" && volume.pdfUrl ? (
        <div className="min-h-0 flex-1">
          <PDFViewer pdfUrl={volume.pdfUrl} />
        </div>
      ) : volume.canEdit ? (
        <NodeContentEditor
          nodeId={volume.id}
          userId={session.user.id}
          workspaceId={volume.workspaceId}
          initialContent={volume.content}
          initialUpdatedAt={volume.updatedAt}
          editable
        />
      ) : (
        <div
          className="p-4"
          dangerouslySetInnerHTML={{
            __html: volume.content,
          }}
        />
      )}
    </div>
  );
}
