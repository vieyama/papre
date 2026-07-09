import { auth } from "@/auth";
import { FolderChildrenList } from "@/components/folder-children-list";
import { NodeContentEditor } from "@/components/node-content-editor";
import { NodeCover } from "@/components/node-cover";
import { NodeDeleteButton } from "@/components/node-delete-button";
import { NodeEmojiPicker } from "@/components/node-emoji-picker";
import { NodeTitleEditor } from "@/components/node-title-editor";
import { PageShareDialog } from "@/components/page-share-dialog";
import { BackButton } from "@/components/back-button";
import { NodeType, WorkspaceRole } from "@/generated/prisma/client";
import { decryptUserData } from "@/lib/data-encryption";
import prisma from "@/lib/prisma";
import { sanitizePageContent } from "@/lib/sanitize-page-content";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

async function getNodeMetadata(sessionUserId: string, nodeId: string) {
  const node = await prisma.node.findFirst({
    where: {
      id: nodeId,
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: sessionUserId },
          { workspaceMembers: { some: { userId: sessionUserId } } },
        ],
      },
    },
    select: {
      title: true,
      type: true,
      workspace: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!node) return null;

  return {
    title: await decryptUserData(
      node.workspace.ownerId,
      `node:${nodeId}:title`,
      node.title,
    ),
    type: node.type,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}): Promise<Metadata> {
  const session = await auth();
  const { nodeId } = await params;

  if (!session?.user?.id) {
    return {
      title: "Page",
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    };
  }

  const node = await getNodeMetadata(session.user.id, nodeId);

  if (!node) {
    return {
      title: "Page not found",
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    };
  }

  return {
    title: node.title,
    description:
      node.type === NodeType.FOLDER
        ? `Browse pages inside ${node.title} in My Djurnal.`
        : `Read and edit ${node.title} in My Djurnal.`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { nodeId } = await params;
  const node = await prisma.node.findFirst({
    where: {
      id: nodeId,
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: session.user.id },
          { workspaceMembers: { some: { userId: session.user.id } } },
        ],
      },
    },
    include: {
      pageContent: true,
      workspace: {
        select: {
          ownerId: true,
          workspaceMembers: {
            where: {
              userId: session.user.id,
            },
            select: {
              role: true,
            },
            take: 1,
          },
        },
      },
      children: {
        where: {
          isArchived: false,
        },
        orderBy: [
          { position: "asc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!node) {
    notFound();
  }

  const coverImage = node.coverImage?.startsWith("minio://")
    ? `/api/nodes/${node.id}/cover`
    : node.coverImage;
  const [title, content, children] = await Promise.all([
    decryptUserData(
      node.workspace.ownerId,
      `node:${node.id}:title`,
      node.title,
    ),
    decryptUserData(
      node.workspace.ownerId,
      `node:${node.id}:content`,
      node.pageContent?.contentText,
    ).then(sanitizePageContent),
    Promise.all(
      node.children.map(async (child) => ({
        id: child.id,
        title: await decryptUserData(
          node.workspace.ownerId,
          `node:${child.id}:title`,
          child.title,
        ),
        type: child.type,
        icon: child.icon,
      })),
    ),
  ]);
  const lastUpdatedAt =
    node.pageContent && node.pageContent.updatedAt > node.updatedAt
      ? node.pageContent.updatedAt
      : node.updatedAt;
  const currentRole =
    node.workspace.ownerId === session.user.id
      ? WorkspaceRole.OWNER
      : node.workspace.workspaceMembers[0]?.role;
  const canEdit =
    currentRole === WorkspaceRole.OWNER ||
    currentRole === WorkspaceRole.ADMIN ||
    currentRole === WorkspaceRole.MEMBER;

  return (
    <>
      <BackButton />
      <NodeCover
        nodeId={node.id}
        workspaceId={node.workspaceId}
        initialCoverImage={coverImage ?? null}
        editable={canEdit}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-8 py-4">
        <div className="flex w-full items-center justify-between">
          <NodeEmojiPicker
            nodeId={node.id}
            workspaceId={node.workspaceId}
            icon={node.icon}
            fallbackIcon={node.type === NodeType.FOLDER ? "📁" : "📄"}
            editable={canEdit}
          />
          {canEdit && (
            <div className="flex items-center gap-2">
              {node.type === NodeType.PAGE && (
                <PageShareDialog
                  nodeId={node.id}
                  workspaceId={node.workspaceId}
                />
              )}
              <NodeDeleteButton
                nodeId={node.id}
                workspaceId={node.workspaceId}
                title={title}
                type={node.type === NodeType.FOLDER ? "folder" : "page"}
                hasChildren={children.length > 0}
              />
            </div>
          )}
        </div>
        <NodeTitleEditor
          nodeId={node.id}
          workspaceId={node.workspaceId}
          title={title}
          editable={canEdit}
        />
        {node.type === NodeType.FOLDER && (
          <FolderChildrenList
            folderId={node.id}
            workspaceId={node.workspaceId}
            nodes={children}
            editable={canEdit}
          />
        )}
        {node.type === NodeType.PAGE && (
          <NodeContentEditor
            nodeId={node.id}
            workspaceId={node.workspaceId}
            initialContent={content}
            initialUpdatedAt={lastUpdatedAt.toISOString()}
            editable={canEdit}
          />
        )}
      </div>
    </>
  );
}
