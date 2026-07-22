"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { FilePlus2Icon, FolderPlusIcon } from "lucide-react";

import { NodeType, WorkspaceRole } from "@/generated/prisma/browser";
import { createNode } from "@/services/node";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import {
  NodeCollectionView,
  type NodeCollectionItem,
} from "@/components/node-collection-view";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

type HomeWorkspace = {
  id: string;
  name: string;
  icon: string | null;
  currentUserRole: WorkspaceRole;
};

type HomeNode = {
  id: string;
  workspaceId: string;
  title: string;
  type: NodeType;
  icon: string | null;
  coverImage: string | null;
  updatedAt: string;
};

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-semibold tracking-tight">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function WorkspaceHome({
  userName,
  workspaces,
  nodes,
}: {
  userName?: string | null;
  workspaces: HomeWorkspace[];
  nodes: HomeNode[];
}) {
  const router = useRouter();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const { selectedWorkspace, hasHydrated } = useWorkspaceStore();
  const [isPending, startTransition] = React.useTransition();
  const [createError, setCreateError] = React.useState<string | null>(null);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspace?.id) ??
    workspaces[0];
  const activeWorkspaceId = activeWorkspace?.id;

  const workspaceNodes = React.useMemo(
    () =>
      nodes
        .filter((node) => node.workspaceId === activeWorkspaceId)
        .sort(
          (first, second) =>
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime(),
        ),
    [activeWorkspaceId, nodes],
  );

  const pageCount = workspaceNodes.filter(
    (node) => node.type === NodeType.PAGE,
  ).length;
  const folderCount = workspaceNodes.length - pageCount;
  const recentNodes: NodeCollectionItem[] = workspaceNodes.slice(0, 6);
  const canEdit = activeWorkspace?.currentUserRole !== WorkspaceRole.VIEWER;

  function handleCreate(type: NodeType) {
    if (!activeWorkspace) return;

    setCreateError(null);
    startTransition(async () => {
      const result = await createNode({
        workspaceId: activeWorkspace?.id,
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
          <h1 className="text-2xl font-semibold">{dict.home.noWorkspaceTitle}</h1>
          <p className="mt-2 text-muted-foreground">
            {dict.home.noWorkspaceDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-8">
      <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl border bg-muted text-xl">
            {activeWorkspace.icon || "🏠"}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {activeWorkspace.name}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {dict.home.welcome}{userName ? `, ${userName.split(" ")[0]}` : ""}
            </h1>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button disabled={isPending} onClick={() => handleCreate(NodeType.PAGE)}>
              <FilePlus2Icon />
              {isPending ? dict.home.creatingLabel : dict.home.newPageButton}
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.FOLDER)}
            >
              <FolderPlusIcon />
              {dict.home.newFolderButton}
            </Button>
          </div>
        )}
      </header>

      {createError && (
        <p className="mt-3 text-sm text-destructive">{createError}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2">
        <StatItem label={dict.home.statsItem} value={workspaceNodes.length} />
        <StatItem label={dict.home.statsPages} value={pageCount} />
        <StatItem label={dict.home.statsFolders} value={folderCount} />
      </div>

      <div className="mt-10">
        <NodeCollectionView
          items={recentNodes}
          getHref={(item) => localeHref(`/home/${item.id}`, lang)}
          title={dict.home.recentTitle}
          description={dict.home.recentDescription}
          emptyTitle={dict.home.emptyTitle}
          emptyDescription={dict.home.emptyDescription}
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
    </div>
  );
}
