"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2Icon, FolderPlusIcon } from "lucide-react";

import { NodeType } from "@/generated/prisma/browser";
import { createNode } from "@/services/node";
import { Button } from "@/components/ui/button";

type FolderChild = {
  id: string;
  title: string;
  type: NodeType;
  icon: string | null;
};

export function FolderChildrenList({
  folderId,
  workspaceId,
  nodes = [],
  editable = true,
}: {
  folderId: string;
  workspaceId: string;
  nodes: FolderChild[];
  editable?: boolean;
}) {
  const router = useRouter();
  const createMutation = useMutation({
    mutationFn: async (type: NodeType) => {
      const result = await createNode({
        workspaceId,
        parentId: folderId,
        type,
      });

      if (result.error || !result.node) {
        throw new Error(result.error ?? "Failed to create node.");
      }

      return result.node;
    },
    onSuccess: (node) => {
      router.push(`/home/${node.id}`);
      router.refresh();
    },
  });

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Inside this folder
        </h2>
        {editable && <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate(NodeType.FOLDER)}
          >
            <FolderPlusIcon />
            New folder
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate(NodeType.PAGE)}
          >
            <FilePlus2Icon />
            New page
          </Button>
        </div>}
      </div>

      {createMutation.error && (
        <p className="mb-3 text-sm text-destructive">
          {createMutation.error.message}
        </p>
      )}

      {nodes.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {nodes.map((child) => (
            <Link
              key={child.id}
              href={`/home/${child.id}`}
              className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-3 py-3 transition-colors hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                {child.icon ? (
                  <span className="text-xl">{child.icon}</span>
                ) : (
                  <Image
                    src={
                      child.type === NodeType.FOLDER
                        ? "/non-empty-folder.svg"
                        : "/files.svg"
                    }
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{child.title}</span>
                <span className="text-xs text-muted-foreground">
                  {child.type === NodeType.FOLDER ? "Folder" : "Page"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          This folder is empty.
        </div>
      )}
    </section>
  );
}
