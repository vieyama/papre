import "server-only";

import { createHash } from "node:crypto";

import { PageShareVisibility } from "@/generated/prisma/client";
import { decryptUserData } from "@/lib/data-encryption";
import prisma from "@/lib/prisma";
import { sanitizePageContent } from "@/lib/sanitize-page-content";

export function hashPageShareToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function getSharedPageByToken(
  token: string,
  currentUserId?: string,
) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return { status: "not-found" as const };
  }

  const share = await prisma.pageShare.findUnique({
    where: {
      tokenHash: hashPageShareToken(token),
    },
    select: {
      visibility: true,
      node: {
        select: {
          id: true,
          title: true,
          icon: true,
          coverImage: true,
          isArchived: true,
          updatedAt: true,
          pageContent: {
            select: {
              contentText: true,
              updatedAt: true,
            },
          },
          workspace: {
            select: {
              name: true,
              ownerId: true,
              workspaceMembers: currentUserId
                ? {
                    where: { userId: currentUserId },
                    select: { id: true },
                    take: 1,
                  }
                : false,
            },
          },
        },
      },
      invitedUsers: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
            take: 1,
          }
        : false,
    },
  });

  if (!share || share.node.isArchived) {
    return { status: "not-found" as const };
  }

  if (share.visibility === PageShareVisibility.INVITED) {
    if (!currentUserId) {
      return { status: "login-required" as const };
    }

    const hasWorkspaceAccess =
      share.node.workspace.ownerId === currentUserId ||
      share.node.workspace.workspaceMembers.length > 0;
    const isInvited = share.invitedUsers.length > 0;

    if (!hasWorkspaceAccess && !isInvited) {
      return { status: "forbidden" as const };
    }
  }

  const [title, content] = await Promise.all([
    decryptUserData(
      share.node.workspace.ownerId,
      `node:${share.node.id}:title`,
      share.node.title,
    ),
    decryptUserData(
      share.node.workspace.ownerId,
      `node:${share.node.id}:content`,
      share.node.pageContent?.contentText,
    ).then(sanitizePageContent),
  ]);
  const updatedAt =
    share.node.pageContent &&
    share.node.pageContent.updatedAt > share.node.updatedAt
      ? share.node.pageContent.updatedAt
      : share.node.updatedAt;

  return {
    status: "ok" as const,
    page: {
      id: share.node.id,
      title,
      content,
      icon: share.node.icon,
      workspaceName: share.node.workspace.name,
      coverImage: share.node.coverImage,
      updatedAt,
    },
  };
}
