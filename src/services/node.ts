"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import {
  NodeType,
  PageContentFormat,
  type Node,
} from "@/generated/prisma/client";
import {
  decryptUserData,
  encryptUserData,
} from "@/lib/data-encryption";
import prisma from "@/lib/prisma";
import {
  MAX_PAGE_CONTENT_LENGTH,
  sanitizePageContent,
} from "@/lib/sanitize-page-content";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { revalidatePath } from "next/cache";

type CreateNodeInput = {
  workspaceId: string;
  parentId?: string | null;
  type: NodeType;
  title?: string;
  calendarDate?: string;
};

type DeleteNodeInput = {
  workspaceId: string;
  nodeId: string;
};

type MoveNodeInput = {
  workspaceId: string;
  nodeId: string;
  parentId?: string | null;
};

type ReorderNodeInput = {
  workspaceId: string;
  nodeId: string;
  direction: "up" | "down";
};

type RenameNodeInput = {
  workspaceId: string;
  nodeId: string;
  title: string;
};

type UpdateNodeIconInput = {
  workspaceId: string;
  nodeId: string;
  icon: string;
};

type UpdateNodeContentInput = {
  workspaceId: string;
  nodeId: string;
  content: string;
};

type UpdateNodeCoverInput = {
  workspaceId: string;
  nodeId: string;
  coverUrl: string;
};

async function canEditWorkspace(userId: string, workspaceId: string) {
  const access = await getWorkspaceAccess(userId, workspaceId);

  return access?.canEdit
    ? {
      id: access.id,
      ownerId: access.ownerId,
    }
    : null;
}

function buildChildrenByParentId(
  nodes: Array<{
    id: string;
    parentId: string | null;
  }>,
) {
  const childrenByParentId = new Map<string, string[]>();

  for (const node of nodes) {
    if (!node.parentId) continue;

    const children = childrenByParentId.get(node.parentId) ?? [];
    children.push(node.id);
    childrenByParentId.set(node.parentId, children);
  }

  return childrenByParentId;
}

function collectDescendantIds(
  nodeId: string,
  childrenByParentId: Map<string, string[]>,
) {
  const descendantIds = new Set<string>([nodeId]);
  const pendingNodeIds = [nodeId];

  while (pendingNodeIds.length > 0) {
    const parentId = pendingNodeIds.pop();

    if (!parentId) continue;

    for (const childId of childrenByParentId.get(parentId) ?? []) {
      if (descendantIds.has(childId)) continue;

      descendantIds.add(childId);
      pendingNodeIds.push(childId);
    }
  }

  return descendantIds;
}

function reorderSiblingIds(
  siblingIds: string[],
  nodeId: string,
  direction: ReorderNodeInput["direction"],
) {
  const currentIndex = siblingIds.indexOf(nodeId);

  if (currentIndex === -1) return siblingIds;

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= siblingIds.length) {
    return siblingIds;
  }

  const reorderedIds = [...siblingIds];
  [reorderedIds[currentIndex], reorderedIds[nextIndex]] = [
    reorderedIds[nextIndex],
    reorderedIds[currentIndex],
  ];

  return reorderedIds;
}

export async function getNodesByUserId(userId: string): Promise<Node[]> {
  const nodes = await prisma.node.findMany({
    where: {
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: userId },
          { workspaceMembers: { some: { userId } } },
        ],
      },
    },
    orderBy: [
      { position: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      workspace: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  return Promise.all(
    nodes.map(async ({ workspace, ...node }) => ({
      ...node,
      title: await decryptUserData(
        workspace.ownerId,
        `node:${node.id}:title`,
        node.title,
      ),
    })),
  );
}

export async function getCalendarPagesByUserId(userId: string) {
  const pages = await prisma.node.findMany({
    where: {
      type: NodeType.PAGE,
      calendarDate: {
        not: null,
      },
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: userId },
          { workspaceMembers: { some: { userId } } },
        ],
      },
    },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      icon: true,
      calendarDate: true,
      workspace: {
        select: {
          ownerId: true,
        },
      },
    },
    orderBy: [
      { calendarDate: "asc" },
      { position: "asc" },
      { createdAt: "asc" },
    ],
  });

  const decryptedPages = await Promise.all(
    pages.map(async (page) => {
      if (!page.calendarDate) return null;

      return {
        id: page.id,
        workspaceId: page.workspaceId,
        title: await decryptUserData(
          page.workspace.ownerId,
          `node:${page.id}:title`,
          page.title,
        ),
        icon: page.icon,
        calendarDate: page.calendarDate.toISOString().slice(0, 10),
      };
    }),
  );

  return decryptedPages.filter((page) => page !== null);
}

export async function createNode(input: CreateNodeInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in to create a page." };
  }

  if (!Object.values(NodeType).includes(input.type)) {
    return { error: "Invalid node type." };
  }

  const title = input.title?.trim();

  if (title && title.length > 100) {
    return { error: "Name must be 100 characters or fewer." };
  }

  let calendarDate: Date | null = null;

  if (input.calendarDate) {
    if (
      input.type !== NodeType.PAGE ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.calendarDate)
    ) {
      return { error: "Invalid calendar date." };
    }

    calendarDate = new Date(`${input.calendarDate}T00:00:00.000Z`);

    if (
      Number.isNaN(calendarDate.getTime()) ||
      calendarDate.toISOString().slice(0, 10) !== input.calendarDate
    ) {
      return { error: "Invalid calendar date." };
    }
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  if (input.parentId) {
    const parent = await prisma.node.findFirst({
      where: {
        id: input.parentId,
        workspaceId: input.workspaceId,
        type: NodeType.FOLDER,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!parent) {
      return { error: "Parent folder was not found." };
    }
  }

  const lastSibling = await prisma.node.findFirst({
    where: {
      workspaceId: input.workspaceId,
      parentId: input.parentId ?? null,
      isArchived: false,
    },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const nodeId = randomUUID();
  const encryptedTitle = await encryptUserData(
    workspace.ownerId,
    `node:${nodeId}:title`,
    title ||
      (input.type === NodeType.FOLDER ? "New folder" : "Untitled"),
  );
  const encryptedContent =
    input.type === NodeType.PAGE
      ? await encryptUserData(
          workspace.ownerId,
          `node:${nodeId}:content`,
          "",
        )
      : null;

  await prisma.node.create({
    data: {
      id: nodeId,
      title: encryptedTitle,
      type: input.type,
      workspaceId: input.workspaceId,
      parentId: input.parentId ?? null,
      createdById: userId,
      calendarDate,
      position: (lastSibling?.position ?? -1) + 1,
      icon: input.type === NodeType.FOLDER ? "📁" : "📄",
      ...(input.type === NodeType.PAGE
        ? {
            pageContent: {
              create: {
                contentText: encryptedContent,
              },
            },
          }
        : {}),
    },
  });

  revalidatePath("/home", "layout");
  revalidatePath("/calendar");

  return {
    node: {
      id: nodeId,
    },
  };
}

export async function renameNode(input: RenameNodeInput) {
  const session = await auth();
  const userId = session?.user?.id;
  const title = input.title.trim();

  if (!userId) {
    return { error: "You must be signed in to rename a node." };
  }

  if (!title) {
    return { error: "Name cannot be empty." };
  }

  if (title.length > 100) {
    return { error: "Name must be 100 characters or fewer." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const encryptedTitle = await encryptUserData(
    workspace.ownerId,
    `node:${input.nodeId}:title`,
    title,
  );

  const result = await prisma.node.updateMany({
    where: {
      id: input.nodeId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    data: {
      title: encryptedTitle,
    },
  });

  if (result.count === 0) {
    return { error: "Node was not found." };
  }

  revalidatePath("/home", "layout");

  return { title };
}

export async function updateNodeIcon(input: UpdateNodeIconInput) {
  const session = await auth();
  const userId = session?.user?.id;
  const icon = input.icon.trim();

  if (!userId) {
    return { error: "You must be signed in to update an icon." };
  }

  if (!icon || icon.length > 32) {
    return { error: "Invalid emoji." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const result = await prisma.node.updateMany({
    where: {
      id: input.nodeId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    data: {
      icon,
    },
  });

  if (result.count === 0) {
    return { error: "Node was not found." };
  }

  revalidatePath("/home", "layout");

  return { icon };
}

export async function updateNodeContent(input: UpdateNodeContentInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in to update page content." };
  }

  if (
    typeof input.content !== "string" ||
    input.content.length > MAX_PAGE_CONTENT_LENGTH
  ) {
    return { error: "Page content is too large." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const page = await prisma.node.findFirst({
    where: {
      id: input.nodeId,
      workspaceId: input.workspaceId,
      type: NodeType.PAGE,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  if (!page) {
    return { error: "Page was not found." };
  }

  const sanitizedContent = sanitizePageContent(input.content);
  const encryptedContent = await encryptUserData(
    workspace.ownerId,
    `node:${page.id}:content`,
    sanitizedContent,
  );

  const pageContent = await prisma.pageContent.upsert({
    where: {
      nodeId: page.id,
    },
    create: {
      nodeId: page.id,
      format: PageContentFormat.HTML,
      contentText: encryptedContent,
    },
    update: {
      format: PageContentFormat.HTML,
      contentText: encryptedContent,
    },
  });

  return {
    success: true as const,
    updatedAt: pageContent.updatedAt.toISOString(),
  };
}

export async function updateNodeCoverUrl(input: UpdateNodeCoverInput) {
  const session = await auth();
  const userId = session?.user?.id;
  const coverUrl = input.coverUrl.trim();

  if (!userId) {
    return { error: "You must be signed in to update a cover." };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(coverUrl);
  } catch {
    return { error: "Enter a valid image URL." };
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    coverUrl.length > 2048
  ) {
    return { error: "Only public HTTP or HTTPS image URLs are allowed." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const result = await prisma.node.updateMany({
    where: {
      id: input.nodeId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    data: {
      coverImage: parsedUrl.toString(),
    },
  });

  if (result.count === 0) {
    return { error: "Node was not found." };
  }

  revalidatePath(`/home/${input.nodeId}`);

  return { coverImage: parsedUrl.toString() };
}

export async function removeNodeCover(input: {
  workspaceId: string;
  nodeId: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in to remove a cover." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const result = await prisma.node.updateMany({
    where: {
      id: input.nodeId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    data: {
      coverImage: null,
    },
  });

  if (result.count === 0) {
    return { error: "Node was not found." };
  }

  revalidatePath(`/home/${input.nodeId}`);

  return { success: true as const };
}

export async function deleteNode(input: DeleteNodeInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in to delete a node." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const archivedNodeIds = await prisma.$transaction(async (tx) => {
    const targetNode = await tx.node.findFirst({
      where: {
        id: input.nodeId,
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!targetNode) {
      return null;
    }

    const workspaceNodes = await tx.node.findMany({
      where: {
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    const ids = [...collectDescendantIds(
      targetNode.id,
      buildChildrenByParentId(workspaceNodes),
    )];

    await tx.node.updateMany({
      where: {
        id: { in: ids },
        workspaceId: input.workspaceId,
      },
      data: {
        isArchived: true,
      },
    });

    return ids;
  });

  if (!archivedNodeIds) {
    return { error: "Node was not found." };
  }

  revalidatePath("/home", "layout");

  return { archivedNodeIds };
}

export async function moveNode(input: MoveNodeInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in to move a node." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const normalizedParentId = input.parentId ?? null;

  const movedNode = await prisma.$transaction(async (tx) => {
    const node = await tx.node.findFirst({
      where: {
        id: input.nodeId,
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    if (!node) {
      return null;
    }

    if (node.parentId === normalizedParentId) {
      return {
        id: node.id,
        parentId: node.parentId,
      };
    }

    const workspaceNodes = await tx.node.findMany({
      where: {
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    const childrenByParentId = buildChildrenByParentId(workspaceNodes);
    const descendantIds = collectDescendantIds(node.id, childrenByParentId);

    if (normalizedParentId && descendantIds.has(normalizedParentId)) {
      return {
        error: "You cannot move a node into itself or its children.",
      } as const;
    }

    if (normalizedParentId) {
      const parent = await tx.node.findFirst({
        where: {
          id: normalizedParentId,
          workspaceId: input.workspaceId,
          type: NodeType.FOLDER,
          isArchived: false,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        return {
          error: "Destination folder was not found.",
        } as const;
      }
    }

    const lastSibling = await tx.node.findFirst({
      where: {
        workspaceId: input.workspaceId,
        parentId: normalizedParentId,
        isArchived: false,
        id: {
          not: node.id,
        },
      },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    await tx.node.updateMany({
      where: {
        id: node.id,
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      data: {
        parentId: normalizedParentId,
        position: (lastSibling?.position ?? -1) + 1,
      },
    });

    return {
      id: node.id,
      parentId: normalizedParentId,
    };
  });

  if (!movedNode) {
    return { error: "Node was not found." };
  }

  if ("error" in movedNode) {
    return { error: movedNode.error };
  }

  revalidatePath("/home", "layout");

  return {
    node: movedNode,
  };
}

export async function reorderNode(input: ReorderNodeInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in to reorder a node." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  if (input.direction !== "up" && input.direction !== "down") {
    return { error: "Invalid reorder direction." };
  }

  const result = await prisma.$transaction(async (tx) => {
    const node = await tx.node.findFirst({
      where: {
        id: input.nodeId,
        workspaceId: input.workspaceId,
        isArchived: false,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    if (!node) {
      return null;
    }

    const siblings = await tx.node.findMany({
      where: {
        workspaceId: input.workspaceId,
        parentId: node.parentId,
        isArchived: false,
      },
      orderBy: [
        { position: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
      },
    });

    const reorderedIds = reorderSiblingIds(
      siblings.map((sibling) => sibling.id),
      node.id,
      input.direction,
    );

    await Promise.all(
      reorderedIds.map((id, position) =>
        tx.node.updateMany({
          where: {
            id,
            workspaceId: input.workspaceId,
            isArchived: false,
          },
          data: {
            position,
          },
        }),
      ),
    );

    return { success: true as const };
  });

  if (!result) {
    return { error: "Node was not found." };
  }

  revalidatePath("/home", "layout");
  revalidatePath("/calendar");

  return result;
}
