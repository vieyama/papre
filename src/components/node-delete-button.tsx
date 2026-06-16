"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  const [open, setOpen] = React.useState(false);
  const deleteButtonRef = React.useRef<HTMLButtonElement | null>(null);
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
      router.replace("/home");
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
        aria-label={`Delete ${type}`}
        title={`Delete ${type}`}
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
            <DialogTitle>Delete {type}?</DialogTitle>
            <DialogDescription>
              &quot;{title}&quot;
              {type === "folder" && hasChildren
                ? " and everything inside it"
                : ""}{" "}
              will be removed from your sidebar.
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
                Cancel
              </Button>
            </DialogClose>
            <Button
              ref={deleteButtonRef}
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : `Delete ${type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
