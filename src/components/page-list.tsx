"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, FilePlus2Icon, FolderPlusIcon } from "lucide-react";

import { NodeType, WorkspaceRole } from "@/generated/prisma/browser";
import { createNode } from "@/services/node";
import { excludeBookNodes } from "@/lib/book-node";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import {
  NodeCollectionView,
  type NodeCollectionItem,
} from "@/components/node-collection-view";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref } from "@/i18n/paths";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

type PageListWorkspace = {
  id: string;
  name: string;
  icon: string | null;
  currentUserRole: WorkspaceRole;
};

type PageListNode = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  type: NodeType;
  icon: string | null;
  coverImage: string | null;
  updatedAt: string;
};

export function PageList({
  workspaces,
  nodes,
}: {
  workspaces: PageListWorkspace[];
  nodes: PageListNode[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const { selectedWorkspace, hasHydrated } = useWorkspaceStore();
  const [isPending, startTransition] = React.useTransition();
  const [createError, setCreateError] = React.useState<string | null>(null);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspace?.id) ??
    workspaces[0];
  const activeWorkspaceId = activeWorkspace?.id;
  const selectedFolderId = searchParams.get("folderId");

  const workspaceNodes = React.useMemo(() => {
    if (!activeWorkspaceId) return [];

    return excludeBookNodes(
      nodes.filter((node) => node.workspaceId === activeWorkspaceId),
    );
  }, [activeWorkspaceId, nodes]);

  const selectedFolder = React.useMemo(() => {
    if (!selectedFolderId) return null;

    return (
      workspaceNodes.find(
        (node) =>
          node.id === selectedFolderId && node.type === NodeType.FOLDER,
      ) ?? null
    );
  }, [selectedFolderId, workspaceNodes]);

  const visibleParentId = selectedFolder?.id ?? null;

  const pages: NodeCollectionItem[] = React.useMemo(() => {
    return workspaceNodes
      .filter((node) => node.parentId === visibleParentId)
      .sort((first, second) => {
        if (first.type !== second.type) {
          return first.type === NodeType.FOLDER ? -1 : 1;
        }

        return (
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime()
        );
      });
  }, [visibleParentId, workspaceNodes]);

  const canEdit = activeWorkspace?.currentUserRole !== WorkspaceRole.VIEWER;

  function handleCreate(type: NodeType) {
    if (!activeWorkspace) return;

    setCreateError(null);
    startTransition(async () => {
      const result = await createNode({
        workspaceId: activeWorkspace?.id,
        parentId: visibleParentId,
        type,
      });

      if (result.error) {
        setCreateError(result.error);
        return;
      }

      if (result.node) {
        router.push(localeHref(`/home/${result.node.id}`, lang));
        router.refresh();
      }
    });
  }

  if (!hasHydrated) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">{dict.pagesRoute.noWorkspaceTitle}</h1>
          <p className="mt-2 text-muted-foreground">
            {dict.pagesRoute.noWorkspaceDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-8">
      {createError && (
        <p className="mb-4 text-sm text-destructive">{createError}</p>
      )}

      <NodeCollectionView
        items={pages}
        getHref={(item) =>
          item.type === NodeType.FOLDER
            ? `${localeHref("/pages", lang)}?folderId=${encodeURIComponent(item.id)}`
            : localeHref(`/home/${item.id}`, lang)
        }
        title={selectedFolder?.title ?? dict.pagesRoute.title}
        description={formatMessage(dict.pagesRoute.description, {
          workspaceName: activeWorkspace.name,
        })}
        actions={
          <>
            {selectedFolder && (
              <Button size="sm" variant="ghost" asChild>
                <Link
                  href={
                    selectedFolder.parentId
                      ? `${localeHref("/pages", lang)}?folderId=${encodeURIComponent(selectedFolder.parentId)}`
                      : localeHref("/pages", lang)
                  }
                >
                  <ArrowLeftIcon />
                  {dict.common.back}
                </Link>
              </Button>
            )}
            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleCreate(NodeType.FOLDER)}
                >
                  <FolderPlusIcon />
                  {dict.pagesRoute.folderButton}
                </Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleCreate(NodeType.PAGE)}
                >
                  <FilePlus2Icon />
                  {dict.pagesRoute.pageButton}
                </Button>
              </>
            )}
          </>
        }
        emptyTitle={dict.pagesRoute.emptyTitle}
        emptyDescription={dict.pagesRoute.emptyDescription}
        emptyAction={
          canEdit && (
            <Button
              className="mt-5"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.PAGE)}
            >
              <FilePlus2Icon />
              {dict.home.emptyAction}
            </Button>
          )
        }
      />
    </div>
  );
}
