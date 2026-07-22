"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlusIcon, LinkIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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
import { Input } from "@/components/ui/input";
import {
  removeNodeCover,
  updateNodeCoverUrl,
} from "@/services/node";
import { useDictionary } from "@/i18n/dictionary-context";

type CoverUrlForm = {
  coverUrl: string;
};

export function NodeCover({
  nodeId,
  workspaceId,
  initialCoverImage,
  editable = true,
}: {
  nodeId: string;
  workspaceId: string;
  initialCoverImage: string | null;
  editable?: boolean;
}) {
  const router = useRouter();
  const dict = useDictionary();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [coverImage, setCoverImage] = React.useState(initialCoverImage);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CoverUrlForm>({
    defaultValues: {
      coverUrl: "",
    },
  });

  const urlMutation = useMutation({
    mutationFn: async (values: CoverUrlForm) => {
      const result = await updateNodeCoverUrl({
        nodeId,
        workspaceId,
        coverUrl: values.coverUrl,
      });

      if (result.error || !result.coverImage) {
        throw new Error(result.error ?? dict.dialogs.cover.failedUpdate);
      }

      return result.coverImage;
    },
    onSuccess: (nextCoverImage) => {
      setCoverImage(nextCoverImage);
      setIsUrlDialogOpen(false);
      reset();
      router.refresh();
    },
    onError: (error) => {
      setError("coverUrl", {
        type: "server",
        message: error.message,
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(dict.dialogs.cover.tooLarge);
      }

      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch(`/api/nodes/${nodeId}/cover`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        coverImage?: string;
        error?: string;
      };

      if (!response.ok || !result.coverImage) {
        throw new Error(result.error ?? dict.dialogs.cover.failedUpload);
      }

      return result.coverImage;
    },
    onSuccess: (nextCoverImage) => {
      setCoverImage(nextCoverImage);
      router.refresh();
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const result = await removeNodeCover({
        nodeId,
        workspaceId,
      });

      if (result.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      setCoverImage(null);
      router.refresh();
    },
  });

  const isPending =
    urlMutation.isPending ||
    uploadMutation.isPending ||
    removeMutation.isPending;
  const mutationError = uploadMutation.error ?? removeMutation.error;
  const safeCoverImage = coverImage?.replace(/["\\\n\r]/g, "");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      uploadMutation.mutate(file);
    }

    event.target.value = "";
  }

  return (
    <>
      <div
        className={
          coverImage
            ? "group/cover relative h-56 w-full overflow-hidden bg-muted bg-cover bg-center"
            : "flex h-auto w-full items-center justify-center"
        }
        style={
          safeCoverImage
            ? { backgroundImage: `url("${safeCoverImage}")` }
            : undefined
        }
      >
        {editable && <div
          className={
            coverImage
              ? "absolute right-4 bottom-4 flex gap-2 opacity-0 transition-opacity group-hover/cover:opacity-100 group-focus-within/cover:opacity-100"
              : "flex gap-2"
          }
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            size="sm"
            variant={coverImage ? "secondary" : "ghost"}
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
            {dict.dialogs.cover.uploadCover}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={coverImage ? "secondary" : "ghost"}
            disabled={isPending}
            onClick={() => setIsUrlDialogOpen(true)}
          >
            {coverImage ? <LinkIcon /> : <ImagePlusIcon />}
            {coverImage ? dict.dialogs.cover.changeUrl : dict.dialogs.cover.addFromUrl}
          </Button>
          {coverImage && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => removeMutation.mutate()}
            >
              <Trash2Icon />
              {dict.dialogs.cover.remove}
            </Button>
          )}
        </div>}
      </div>

      {mutationError && (
        <p className="mx-auto mt-2 w-full max-w-4xl px-8 text-sm text-destructive">
          {mutationError.message}
        </p>
      )}

      {editable && <Dialog
        open={isUrlDialogOpen}
        onOpenChange={(open) => {
          if (!urlMutation.isPending) {
            setIsUrlDialogOpen(open);
            if (!open) reset();
          }
        }}
      >
        <DialogContent>
          <form
            onSubmit={handleSubmit((values) => urlMutation.mutate(values))}
          >
            <DialogHeader>
              <DialogTitle>{dict.dialogs.cover.addCoverTitle}</DialogTitle>
              <DialogDescription>
                {dict.dialogs.cover.addCoverDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="my-6">
              <Input
                type="url"
                placeholder={dict.dialogs.cover.urlPlaceholder}
                autoFocus
                disabled={urlMutation.isPending}
                aria-invalid={errors.coverUrl !== undefined}
                {...register("coverUrl", {
                  required: dict.dialogs.cover.urlRequired,
                  maxLength: {
                    value: 2048,
                    message: dict.dialogs.cover.urlTooLong,
                  },
                })}
              />
              {errors.coverUrl?.message && (
                <p className="mt-2 text-sm text-destructive">
                  {errors.coverUrl.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={urlMutation.isPending}
                >
                  {dict.dialogs.cover.cancel}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={urlMutation.isPending}>
                {urlMutation.isPending ? dict.dialogs.cover.saving : dict.dialogs.cover.saveCover}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>}
    </>
  );
}
