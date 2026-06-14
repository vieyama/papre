"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  Clock3Icon,
  FilePlus2Icon,
  FilesIcon,
  FolderIcon,
  FolderPlusIcon,
} from "lucide-react";

import { NodeType, WorkspaceRole } from "@/generated/prisma/browser";
import { createNode } from "@/services/node";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

function getCoverUrl(node: HomeNode) {
  if (!node.coverImage) return null;

  return node.coverImage.startsWith("minio://")
    ? `/api/nodes/${node.id}/cover`
    : node.coverImage;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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
  const recentNodes = workspaceNodes.slice(0, 6);
  const canEdit = activeWorkspace.currentUserRole !== WorkspaceRole.VIEWER;

  function handleCreate(type: NodeType) {
    if (!activeWorkspace) return;

    setCreateError(null);
    startTransition(async () => {
      const result = await createNode({
        workspaceId: activeWorkspace.id,
        type,
      });

      if (result.error) {
        setCreateError(result.error);
        return;
      }

      if (result.node) {
        router.push(`/home/${result.node.id}`);
        router.refresh();
      }
    });
  }

  if (!hasHydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Belum ada workspace</h1>
          <p className="mt-2 text-muted-foreground">
            Buat workspace dari sidebar untuk mulai menulis dan mengatur
            halamanmu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10 md:py-12">
      <section className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-muted/80 via-background to-background px-6 py-8 md:px-10 md:py-10">
        <div className="absolute -top-20 -right-12 size-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border bg-background text-2xl shadow-sm">
            {activeWorkspace.icon || "🏠"}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {activeWorkspace.name}
          </p>
          <h1 className="mt-1 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Selamat datang{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Lanjutkan catatan terakhir atau mulai halaman baru untuk menuangkan
            idemu.
          </p>

          {canEdit && <div className="mt-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.PAGE)}
            >
              <FilePlus2Icon />
              {isPending ? "Membuat..." : "Halaman baru"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.FOLDER)}
            >
              <FolderPlusIcon />
              Folder baru
            </Button>
          </div>}

          {createError && (
            <p className="mt-3 text-sm text-destructive">{createError}</p>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total item</CardDescription>
            <CardTitle className="text-2xl">{workspaceNodes.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <FilesIcon className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Halaman</CardDescription>
            <CardTitle className="text-2xl">{pageCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <FilePlus2Icon className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Folder</CardDescription>
            <CardTitle className="text-2xl">{folderCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <FolderIcon className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Terakhir diperbarui
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Item yang baru saja diperbarui di workspace ini.
            </p>
          </div>
        </div>

        {recentNodes.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {recentNodes.map((node) => {
              const coverUrl = getCoverUrl(node);

              return (
                <Link
                  key={node.id}
                  href={`/home/${node.id}`}
                  className="group overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/40"
                >
                  <div
                    className="flex h-24 items-center justify-center bg-muted/60 bg-cover bg-center"
                    style={
                      coverUrl
                        ? { backgroundImage: `url("${coverUrl}")` }
                        : undefined
                    }
                  >
                    {!coverUrl && (
                      <span className="text-3xl">
                        {node.icon ||
                          (node.type === NodeType.FOLDER ? "📁" : "📄")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <span className="text-lg">
                      {node.icon ||
                        (node.type === NodeType.FOLDER ? "📁" : "📄")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{node.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3Icon className="size-3" />
                        {formatUpdatedAt(node.updatedAt)}
                      </p>
                    </div>
                    <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
              <FilePlus2Icon className="size-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-medium">Workspace masih kosong</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Buat halaman pertama untuk mulai menulis catatan, ide, atau jurnal
              harianmu.
            </p>
            {canEdit && <Button
              className="mt-5"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.PAGE)}
            >
              <FilePlus2Icon />
              Buat halaman pertama
            </Button>}
          </div>
        )}
      </section>
    </div>
  );
}
