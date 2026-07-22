"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { FilePlus2Icon, FolderPlusIcon } from "lucide-react";

import { NodeType } from "@/generated/prisma/browser";
import { createNode } from "@/services/node";
import { Button } from "@/components/ui/button";
import {
  NodeCollectionView,
  type NodeCollectionItem,
} from "@/components/node-collection-view";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

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
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const createMutation = useMutation({
    mutationFn: async (type: NodeType) => {
      const result = await createNode({
        workspaceId,
        parentId: folderId,
        type,
      });

      if (result.error || !result.node) {
        throw new Error(result.error ?? dict.folderChildren.createError);
      }

      return result.node;
    },
    onSuccess: (node) => {
      router.push(localeHref(`/home/${node.id}`, lang));
      router.refresh();
    },
  });

  return (
    <div className="mt-2 min-[830px]:mt-6">
      {createMutation.error && (
        <p className="mb-3 text-sm text-destructive">
          {createMutation.error.message}
        </p>
      )}

      <NodeCollectionView
        items={nodes}
        getHref={(item) => localeHref(`/home/${item.id}`, lang)}
        title={dict.folderChildren.title}
        description={dict.folderChildren.description}
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
                {dict.folderChildren.newPage}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate(NodeType.FOLDER)}
              >
                <FolderPlusIcon />
                {dict.folderChildren.newFolder}
              </Button>
            </>
          )
        }
        emptyTitle={dict.folderChildren.emptyTitle}
        emptyDescription={dict.folderChildren.emptyDescription}
        emptyAction={
          editable && (
            <Button
              className="mt-5"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(NodeType.PAGE)}
            >
              <FilePlus2Icon />
              {dict.folderChildren.addPage}
            </Button>
          )
        }
      />
    </div>
  );
}
