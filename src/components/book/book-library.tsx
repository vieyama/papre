"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BookOpenIcon,
  LibraryBigIcon,
  PlusIcon,
} from "lucide-react";

import { createBookCollection, type BookCollectionSummary } from "@/services/book";
import { WorkspaceRole } from "@/generated/prisma/browser";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatShortDate } from "@/lib/format-date";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref } from "@/i18n/paths";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

type BookWorkspace = {
  id: string;
  name: string;
  icon: string | null;
  currentUserRole: WorkspaceRole;
};

export function BookLibrary({
  workspaces,
  collections,
}: {
  workspaces: BookWorkspace[];
  collections: BookCollectionSummary[];
}) {
  const router = useRouter();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const { selectedWorkspace, hasHydrated } = useWorkspaceStore();
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspace?.id) ??
    workspaces[0];
  const activeWorkspaceId = activeWorkspace?.id;
  const canCreate = activeWorkspace?.currentUserRole !== WorkspaceRole.VIEWER;

  const workspaceCollections = React.useMemo(
    () => collections.filter((collection) => collection.workspaceId === activeWorkspaceId),
    [collections, activeWorkspaceId],
  );

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!activeWorkspaceId) return;

    startTransition(async () => {
      const result = await createBookCollection({
        workspaceId: activeWorkspaceId,
        title,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setTitle("");
      setOpen(false);
      router.push(localeHref(`/book/${result.collection?.id}`, lang));
      router.refresh();
    });
  }

  if (!hasHydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10 md:py-12">
      <section className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-4 flex size-12 items-center justify-center rounded-lg border bg-muted">
            <LibraryBigIcon className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {dict.book.library.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {dict.book.library.description}
          </p>
        </div>

        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon />
                {dict.book.library.newCollection}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate} className="grid gap-5">
                <DialogHeader>
                  <DialogTitle>{dict.book.library.newCollectionTitle}</DialogTitle>
                  <DialogDescription>
                    {dict.book.library.newCollectionDescription}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                  <Label htmlFor="book-title">{dict.book.library.nameLabel}</Label>
                  <Input
                    id="book-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={dict.book.library.namePlaceholder}
                    maxLength={100}
                    required
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <DialogFooter>
                  <Button type="submit" disabled={isPending || !activeWorkspaceId}>
                    {isPending ? dict.book.library.creating : dict.book.library.create}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </section>

      <section className="mt-8">
        {workspaceCollections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceCollections.map((collection) => (
              <Link
                key={collection.id}
                href={localeHref(`/book/${collection.id}`, lang)}
                className="group flex min-h-44 flex-col justify-between rounded-lg border bg-card p-5 transition-colors hover:bg-muted/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-2xl">
                      📚
                    </span>
                    <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <h2 className="mt-5 line-clamp-2 text-lg font-semibold">
                    {collection.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {collection.workspaceName}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatMessage(dict.book.library.volumesCount, { count: collection.volumeCount })}</span>
                  <span>{formatShortDate(collection.updatedAt, lang)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-muted">
              <BookOpenIcon className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-medium">{dict.book.library.emptyTitle}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {dict.book.library.emptyDescription}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
