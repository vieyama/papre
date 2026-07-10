import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getBookReaderVolume } from "@/services/book";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PDFViewer } from "@/components/pdf-viewer";
import { NodeContentEditor } from "@/components/node-content-editor";

export const metadata: Metadata = {
  title: "Read book",
  description: "Read a PDF or manually written book volume",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function BookVolumePage({
  params,
  searchParams
}: {
  params: Promise<{ collectionId: string; volumeId: string }>;
  searchParams: SearchParams;
}) {
  const resolvedParams = await searchParams;
  const mode = resolvedParams.mode;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { collectionId, volumeId } = await params;
  const volume = await getBookReaderVolume(
    session.user.id,
    collectionId,
    volumeId,
  );

  if (!volume) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.75rem)] w-full max-w-7xl flex-col px-4 py-1 sm:px-8">
      <div className="flex mb-2 justify-between items-center">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/book/${volume.collectionId}`}>
            <ArrowLeftIcon />
            Back
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
        <PDFViewer pdfUrl={volume.pdfUrl} />
      ) : (
        mode === 'form' ?
          <NodeContentEditor
            nodeId={volume.id}
            workspaceId={volume.workspaceId}
            initialContent={volume.content}
            initialUpdatedAt={volume.updatedAt}
            editable={volume.canEdit}
          /> : <div
          className="p-4"
            dangerouslySetInnerHTML={{
                __html: volume?.content,
            }}
          />
      )}
    </div>
  );
}
