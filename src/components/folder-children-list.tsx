"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FilePlus2Icon, FolderPlusIcon } from "lucide-react";

import { NodeType } from "@/generated/prisma/browser";
import { createNode } from "@/services/node";
import { Button } from "@/components/ui/button";
import {
  NodeCollectionView,
  type NodeCollectionItem,
} from "@/components/node-collection-view";

export function FolderChildrenList({
  folderId,
  workspaceId,
  nodes = [],
  editable = true,
}: {
  folderId: string;
  workspaceId: string;
  nodes: NodeCollectionItem[];
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
    <div className="mt-10">
      {createMutation.error && (
        <p className="mb-3 text-sm text-destructive">
          {createMutation.error.message}
        </p>
      )}

      <NodeCollectionView
        items={nodes}
        getHref={(item) => `/home/${item.id}`}
        title="Inside this folder"
        description="Pages and folders nested inside this one."
        actions={
          editable && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate(NodeType.PAGE)}
              >
                <FilePlus2Icon />
                New page
              </Button>
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
            </>
          )
        }
        emptyTitle="This folder is empty"
        emptyDescription="Add a page or folder to start organizing content here."
        emptyAction={
          editable && (
            <Button
              className="mt-5"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(NodeType.PAGE)}
            >
              <FilePlus2Icon />
              Add a page
            </Button>
          )
        }
      />
    </div>
  );
}
