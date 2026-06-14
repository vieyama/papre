"use server";

import { randomBytes } from "node:crypto";

import { auth } from "@/auth";
import {
  NodeType,
  PageShareVisibility,
} from "@/generated/prisma/client";
import {
  decryptUserData,
  encryptUserData,
} from "@/lib/data-encryption";
import { hashPageShareToken } from "@/lib/page-share";
import prisma from "@/lib/prisma";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { revalidatePath } from "next/cache";

async function getEditablePage(
  userId: string,
  workspaceId: string,
  nodeId: string,
) {
  const access = await getWorkspaceAccess(userId, workspaceId);

  if (!access?.canEdit) return null;

  const page = await prisma.node.findFirst({
    where: {
      id: nodeId,
      workspaceId,
      type: NodeType.PAGE,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  return page
    ? {
        ...page,
        ownerId: access.ownerId,
      }
    : null;
}

async function serializeShare(nodeId: string, ownerId: string) {
  const share = await prisma.pageShare.findUnique({
    where: { nodeId },
    select: {
      id: true,
      visibility: true,
      tokenEncrypted: true,
      invitedUsers: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!share) return null;

  const token = await decryptUserData(
    ownerId,
    `node:${nodeId}:share-token`,
    share.tokenEncrypted,
  );

  return {
    id: share.id,
    visibility: share.visibility,
    path: `/share/${token}`,
    invitedUsers: share.invitedUsers,
  };
}

export async function getPageShareSettings(input: {
  workspaceId: string;
  nodeId: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: "You must be signed in." };

  const page = await getEditablePage(
    userId,
    input.workspaceId,
    input.nodeId,
  );

  if (!page) return { error: "You cannot share this page." };

  return {
    share: await serializeShare(page.id, page.ownerId),
  };
}

export async function createPageShare(input: {
  workspaceId: string;
  nodeId: string;
  visibility?: PageShareVisibility;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: "You must be signed in." };

  const visibility = input.visibility ?? PageShareVisibility.INVITED;

  if (!Object.values(PageShareVisibility).includes(visibility)) {
    return { error: "Invalid share visibility." };
  }

  const page = await getEditablePage(
    userId,
    input.workspaceId,
    input.nodeId,
  );

  if (!page) return { error: "You cannot share this page." };

  const existingShare = await serializeShare(page.id, page.ownerId);

  if (existingShare) {
    return { share: existingShare };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenEncrypted = await encryptUserData(
    page.ownerId,
    `node:${page.id}:share-token`,
    token,
  );

  await prisma.pageShare.create({
    data: {
      nodeId: page.id,
      visibility,
      tokenHash: hashPageShareToken(token),
      tokenEncrypted,
    },
  });

  revalidatePath(`/home/${page.id}`);

  return {
    share: await serializeShare(page.id, page.ownerId),
  };
}

export async function updatePageShareVisibility(input: {
  workspaceId: string;
  nodeId: string;
  visibility: PageShareVisibility;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: "You must be signed in." };

  if (!Object.values(PageShareVisibility).includes(input.visibility)) {
    return { error: "Invalid share visibility." };
  }

  const page = await getEditablePage(
    userId,
    input.workspaceId,
    input.nodeId,
  );

  if (!page) return { error: "You cannot share this page." };

  const result = await prisma.pageShare.updateMany({
    where: { nodeId: page.id },
    data: { visibility: input.visibility },
  });

  if (result.count === 0) {
    return { error: "Create a share link first." };
  }

  revalidatePath(`/home/${page.id}`);

  return {
    share: await serializeShare(page.id, page.ownerId),
  };
}

export async function inviteUserToPage(input: {
  workspaceId: string;
  nodeId: string;
  email: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const email = input.email.trim().toLowerCase();

  if (!userId) return { error: "You must be signed in." };

  if (!email || email.length > 320) {
    return { error: "Enter a valid email address." };
  }

  const page = await getEditablePage(
    userId,
    input.workspaceId,
    input.nodeId,
  );

  if (!page) return { error: "You cannot share this page." };

  const [share, targetUser] = await Promise.all([
    prisma.pageShare.findUnique({
      where: { nodeId: page.id },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { email },
      select: { id: true },
    }),
  ]);

  if (!share) return { error: "Create a share link first." };
  if (!targetUser) {
    return { error: "No registered user was found with this email." };
  }

  await prisma.pageShareInvite.upsert({
    where: {
      shareId_userId: {
        shareId: share.id,
        userId: targetUser.id,
      },
    },
    create: {
      shareId: share.id,
      userId: targetUser.id,
    },
    update: {},
  });

  return {
    share: await serializeShare(page.id, page.ownerId),
  };
}

export async function removePageInvite(input: {
  workspaceId: string;
  nodeId: string;
  inviteId: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: "You must be signed in." };

  const page = await getEditablePage(
    userId,
    input.workspaceId,
    input.nodeId,
  );

  if (!page) return { error: "You cannot share this page." };

  await prisma.pageShareInvite.deleteMany({
    where: {
      id: input.inviteId,
      share: {
        nodeId: page.id,
      },
    },
  });

  return {
    share: await serializeShare(page.id, page.ownerId),
  };
}

export async function disablePageShare(input: {
  workspaceId: string;
  nodeId: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: "You must be signed in." };

  const page = await getEditablePage(
    userId,
    input.workspaceId,
    input.nodeId,
  );

  if (!page) return { error: "You cannot share this page." };

  await prisma.pageShare.deleteMany({
    where: { nodeId: page.id },
  });

  revalidatePath(`/home/${page.id}`);

  return { success: true as const };
}
