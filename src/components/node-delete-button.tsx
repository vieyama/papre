"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { deleteNode } from "@/services/node";
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
import { localeHref } from "@/i18n/paths";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

export function NodeDeleteButton({
  nodeId,
  workspaceId,
  title,
  type,
  hasChildren = false,
}: {
  nodeId: string;
  workspaceId: string;
  title: string;
  type: "folder" | "page";
  hasChildren?: boolean;
}) {
  const router = useRouter();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const [open, setOpen] = React.useState(false);
  const deleteButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const isFolder = type === "folder";
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteNode({
        workspaceId,
        nodeId,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      setOpen(false);
      router.replace(localeHref("/home", lang));
      router.refresh();
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={isFolder ? dict.dialogs.delete.deleteFolder : dict.dialogs.delete.deletePage}
        title={isFolder ? dict.dialogs.delete.deleteFolder : dict.dialogs.delete.deletePage}
      >
        <Trash2Icon />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!deleteMutation.isPending) {
            setOpen(nextOpen);
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
            <DialogTitle>{isFolder ? dict.dialogs.delete.titleFolder : dict.dialogs.delete.titlePage}</DialogTitle>
            <DialogDescription>
              {formatMessage(dict.dialogs.delete.description, {
                title,
                extra: isFolder && hasChildren ? dict.dialogs.delete.extraFolder : dict.dialogs.delete.extraPage,
              })}
            </DialogDescription>
          </DialogHeader>

          {deleteMutation.error && (
            <p className="text-sm text-destructive">
              {deleteMutation.error.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
              >
                {dict.dialogs.delete.cancel}
              </Button>
            </DialogClose>
            <Button
              ref={deleteButtonRef}
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending
                ? dict.dialogs.delete.deleting
                : isFolder ? dict.dialogs.delete.deleteFolder : dict.dialogs.delete.deletePage}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
