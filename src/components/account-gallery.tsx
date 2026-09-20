"use client";

import { FileTextIcon, ImageIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDictionary } from "@/i18n/dictionary-context";
import type { GalleryAsset } from "@/services/gallery";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function groupAssets(assets: GalleryAsset[]) {
  const buckets = new Map<string, Map<string, GalleryAsset[]>>();

  for (const asset of assets) {
    const folders = buckets.get(asset.bucket) ?? new Map<string, GalleryAsset[]>();
    const folderAssets = folders.get(asset.folder) ?? [];
    folderAssets.push(asset);
    folders.set(asset.folder, folderAssets);
    buckets.set(asset.bucket, folders);
  }

  return [...buckets].map(([bucket, folders]) => ({
    bucket,
    folders: [...folders],
  }));
}

export function AccountGallery({ assets }: { assets: GalleryAsset[] }) {
  const dict = useDictionary();
  const router = useRouter();
  const [selected, setSelected] = useState<GalleryAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteSelected() {
    if (!selected) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/gallery/${selected.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? dict.gallery.deleteError);

      setSelected(null);
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : dict.gallery.deleteError,
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (assets.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center border-y py-12 text-center">
        <ImageIcon className="size-9 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-base font-semibold">{dict.gallery.emptyTitle}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {dict.gallery.emptyDescription}
        </p>
      </div>
    );
  }

  const groupedAssets = groupAssets(assets);

  return (
    <>
      <div className="space-y-10">
        {groupedAssets.map(({ bucket, folders }) => (
          <section key={bucket}>
            <div className="mb-5 flex items-baseline gap-2 border-b pb-3">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {dict.gallery.bucketLabel}
              </span>
              <h2 className="font-semibold">{bucket}</h2>
            </div>

            <div className="space-y-8">
              {folders.map(([folder, folderAssets]) => (
                <section key={folder}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-medium">{folder}</span>
                    <span className="text-xs text-muted-foreground">
                      {folderAssets.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {folderAssets.map((asset) => {
                      const isImage = asset.mimeType.startsWith("image/");

                      return (
                        <article key={asset.id} className="overflow-hidden rounded-md border bg-card">
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex aspect-square items-center justify-center bg-muted"
                          >
                            {isImage ? (
                              // The authenticated endpoint cannot be handled by next/image.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={asset.url}
                                alt={asset.name}
                                className="size-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <FileTextIcon className="size-12 text-red-500" aria-hidden="true" />
                            )}
                          </a>
                          <div className="flex items-start gap-2 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium" title={asset.name}>
                                {asset.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatBytes(asset.size)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="shrink-0 text-destructive hover:text-destructive"
                              title={dict.gallery.deleteFile}
                              onClick={() => setSelected(asset)}
                            >
                              <Trash2Icon />
                              <span className="sr-only">{dict.gallery.deleteFile}</span>
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.gallery.deleteTitle}</DialogTitle>
            <DialogDescription>
              {dict.gallery.deleteDescription.replace("{name}", selected?.name ?? "")}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                {dict.common.cancel}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={deleteSelected}
            >
              <Trash2Icon />
              {isDeleting ? dict.common.deleting : dict.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
