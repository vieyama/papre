"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";

import {
  createBookHtmlVolume,
  deleteBookCollection,
  deleteBookVolume,
  importBookPdf,
  type BookVolumeSummary,
} from "@/services/book";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref } from "@/i18n/paths";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

type BookCollection = {
  id: string;
  workspaceId: string;
  title: string;
  workspaceName: string;
  canEdit: boolean;
  volumes: BookVolumeSummary[];
};

type DeleteTarget =
  | {
    type: "collection";
    id: string;
    title: string;
  }
  | {
    type: "volume";
    id: string;
    title: string;
  };

function formatUpdatedAt(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function BookCollectionDetail({
  collection,
}: {
  collection: BookCollection;
}) {
  const router = useRouter();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const [open, setOpen] = React.useState(false);
  const [manualTitle, setManualTitle] = React.useState("");
  const [pdfTitle, setPdfTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(
    null,
  );
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const deleteButtonRef = React.useRef<HTMLButtonElement | null>(null);

  function handleCreateManual(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createBookHtmlVolume({
        workspaceId: collection.workspaceId,
        collectionId: collection.id,
        title: manualTitle,
      });

      if (result.error || !result.volume?.id) {
        const message = result.error ?? dict.book.collectionDetail.createVolumeError;
        setError(message);
        return;
      }

      setManualTitle("");
      setOpen(false);
      router.push(localeHref(`/book/${collection.id}/${result.volume.id}?mode=create`, lang));
      router.refresh();
    });
  }

  function handleImportPdf(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("workspaceId", collection.workspaceId);
    formData.set("collectionId", collection.id);
    formData.set("title", pdfTitle);

    startTransition(async () => {
      const result = await importBookPdf(formData);
      if (result.error || !result.volume?.id) {
        console.error(result.error)
        const message = result.error || dict.book.collectionDetail.importPdfError;
        setError(message);
        return;
      }

      setPdfTitle("");
      setOpen(false);
      router.push(localeHref(`/book/${collection.id}/${result.volume.id}`, lang));
      router.refresh();
    });
  }

  function handleDeleteTarget() {
    if (!deleteTarget) return;

    setDeleteError(null);

    startTransition(async () => {
      const result =
        deleteTarget.type === "collection"
          ? await deleteBookCollection({
            workspaceId: collection.workspaceId,
            collectionId: collection.id,
          })
          : await deleteBookVolume({
            workspaceId: collection.workspaceId,
            collectionId: collection.id,
            volumeId: deleteTarget.id,
          });

      if (result.error) {
        setDeleteError(result.error);
        return;
      }

      setDeleteTarget(null);

      if (deleteTarget.type === "collection") {
        router.push(localeHref("/book", lang));
      }

      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10 md:py-12">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={localeHref("/book", lang)}>
            <ArrowLeftIcon />
            {dict.common.back}
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-muted text-2xl">
            📚
          </div>
          <p className="text-sm text-muted-foreground">
            {collection.workspaceName}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {collection.title}
          </h1>
        </div>

        {collection.canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteTarget({
                  type: "collection",
                  id: collection.id,
                  title: collection.title,
                })
              }
            >
              <Trash2Icon />
              {dict.book.collectionDetail.deleteCollection}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon />
                  {dict.book.collectionDetail.addVolume}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{dict.book.collectionDetail.addVolumeTitle}</DialogTitle>
                  <DialogDescription>
                    {dict.book.collectionDetail.addVolumeDescription}
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="pdf">
                  <TabsList className="w-full">
                    <TabsTrigger value="pdf" className="w-full">
                      <UploadIcon />
                      {dict.book.collectionDetail.tabPdf}
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="w-full">
                      <FileTextIcon />
                      {dict.book.collectionDetail.tabWrite}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf">
                    <form onSubmit={handleImportPdf} className="mt-4 grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="pdf-title">{dict.book.collectionDetail.volumeTitleLabel}</Label>
                        <Input
                          id="pdf-title"
                          name="title"
                          value={pdfTitle}
                          onChange={(event) => setPdfTitle(event.target.value)}
                          placeholder={dict.book.collectionDetail.volumeTitlePlaceholder}
                          maxLength={100}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pdf-file">{dict.book.collectionDetail.pdfFileLabel}</Label>
                        <Input
                          id="pdf-file"
                          name="file"
                          type="file"
                          accept="application/pdf,.pdf"
                          required
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}
                      <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? dict.book.collectionDetail.importing : dict.book.collectionDetail.importPdf}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>

                  <TabsContent value="manual">
                    <form
                      onSubmit={handleCreateManual}
                      className="mt-4 grid gap-4"
                    >
                      <div className="grid gap-2">
                        <Label htmlFor="manual-title">{dict.book.collectionDetail.volumeTitleLabel}</Label>
                        <Input
                          id="manual-title"
                          value={manualTitle}
                          onChange={(event) =>
                            setManualTitle(event.target.value)
                          }
                          placeholder={dict.book.collectionDetail.volumeTitlePlaceholder}
                          maxLength={100}
                          required
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}
                      <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? dict.book.collectionDetail.creating : dict.book.collectionDetail.startWriting}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </section>

      <section className="mt-8">
        {collection.volumes.length > 0 ? (
          <div className="grid gap-3">
            {collection.volumes.map((volume) => (
              <div
                key={volume.id}
                className="flex items-center gap-2 rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/40"
              >
                <Link
                  href={localeHref(`/book/${collection.id}/${volume.id}`, lang)}
                  className="group flex min-w-0 flex-1 items-center gap-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                    {volume.kind === "pdf" ? "📕" : "📖"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {volume.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {volume.kind === "pdf" ? dict.book.collectionDetail.kindPdf : dict.book.collectionDetail.kindManual} ·{" "}
                      {formatUpdatedAt(volume.updatedAt, lang)}
                    </span>
                  </span>
                  <BookOpenIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
                {collection.canEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setDeleteTarget({
                        type: "volume",
                        id: volume.id,
                        title: volume.title,
                      })
                    }
                    aria-label={formatMessage(dict.book.collectionDetail.deleteAria, { title: volume.title })}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-muted">
              <BookOpenIcon className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-medium">{dict.book.collectionDetail.emptyTitle}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {dict.book.collectionDetail.emptyDescription}
            </p>
          </div>
        )}
      </section>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isPending) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            deleteButtonRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.type === "collection"
                ? dict.book.collectionDetail.deleteTitleCollection
                : dict.book.collectionDetail.deleteTitleVolume}
            </DialogTitle>
            <DialogDescription>
              {formatMessage(dict.book.collectionDetail.deleteDescription, {
                title: deleteTarget?.title ?? "",
                extra:
                  deleteTarget?.type === "collection" && collection.volumes.length > 0
                    ? dict.book.collectionDetail.extraCollectionNote
                    : "",
              })}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                {dict.book.collectionDetail.cancel}
              </Button>
            </DialogClose>
            <Button
              ref={deleteButtonRef}
              variant="destructive"
              disabled={isPending}
              onClick={handleDeleteTarget}
            >
              {isPending ? dict.book.collectionDetail.deleting : dict.book.collectionDetail.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
