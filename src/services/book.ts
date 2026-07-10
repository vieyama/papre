"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import {
  NodeType,
  PageContentFormat,
  WorkspaceRole,
  type Prisma,
} from "@/generated/prisma/client";
import {
  decryptUserData,
  encryptUserData,
} from "@/lib/data-encryption";
import { storeBookPdf } from "@/lib/minio";
import prisma from "@/lib/prisma";
import { sanitizePageContent } from "@/lib/sanitize-page-content";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { revalidatePath } from "next/cache";

const BOOK_COLLECTION_ICON = "📚";
const BOOK_HTML_ICON = "📖";
const BOOK_PDF_ICON = "📕";

type CreateBookCollectionInput = {
  workspaceId: string;
  title: string;
};

type CreateBookVolumeInput = {
  workspaceId: string;
  collectionId: string;
  title: string;
};

type DeleteBookCollectionInput = {
  workspaceId: string;
  collectionId: string;
};

type DeleteBookVolumeInput = {
  workspaceId: string;
  collectionId: string;
  volumeId: string;
};

export type BookVolumeKind = "html" | "pdf";

export type BookCollectionSummary = {
  id: string;
  workspaceId: string;
  title: string;
  workspaceName: string;
  volumeCount: number;
  updatedAt: string;
};

export type BookVolumeSummary = {
  id: string;
  title: string;
  kind: BookVolumeKind;
  updatedAt: string;
};

export type BookReaderVolume = BookVolumeSummary & {
  workspaceId: string;
  collectionId: string;
  collectionTitle: string;
  canEdit: boolean;
  content: string;
  pdfUrl: string | null;
};

function isPdfBookContent(value: unknown): value is {
  kind: "book-pdf";
  pdfRef: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "book-pdf" &&
    "pdfRef" in value &&
    typeof value.pdfRef === "string"
  );
}

async function canEditWorkspace(userId: string, workspaceId: string) {
  const access = await getWorkspaceAccess(userId, workspaceId);

  return access?.canEdit
    ? {
        id: access.id,
        ownerId: access.ownerId,
      }
    : null;
}

async function getBookCollectionForEdit(
  userId: string,
  workspaceId: string,
  collectionId: string,
) {
  const workspace = await canEditWorkspace(userId, workspaceId);

  if (!workspace) return null;

  const collection = await prisma.node.findFirst({
    where: {
      id: collectionId,
      workspaceId,
      type: NodeType.FOLDER,
      icon: BOOK_COLLECTION_ICON,
      isArchived: false,
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  return collection ? { collection, workspace } : null;
}

async function getLastVolumePosition(workspaceId: string, collectionId: string) {
  const lastSibling = await prisma.node.findFirst({
    where: {
      workspaceId,
      parentId: collectionId,
      isArchived: false,
    },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return (lastSibling?.position ?? -1) + 1;
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

export async function getBookCollectionsByUserId(
  userId: string,
): Promise<BookCollectionSummary[]> {
  const collections = await prisma.node.findMany({
    where: {
      type: NodeType.FOLDER,
      icon: BOOK_COLLECTION_ICON,
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: userId },
          { workspaceMembers: { some: { userId } } },
        ],
      },
    },
    include: {
      workspace: {
        select: {
          name: true,
          ownerId: true,
        },
      },
      _count: {
        select: {
          children: {
            where: {
              type: NodeType.PAGE,
              isArchived: false,
            },
          },
        },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return Promise.all(
    collections.map(async (collection) => ({
      id: collection.id,
      workspaceId: collection.workspaceId,
      title: await decryptUserData(
        collection.workspace.ownerId,
        `node:${collection.id}:title`,
        collection.title,
      ),
      workspaceName: collection.workspace.name,
      volumeCount: collection._count.children,
      updatedAt: collection.updatedAt.toISOString(),
    })),
  );
}

export async function getBookCollectionDetail(
  userId: string,
  collectionId: string,
) {
  const collection = await prisma.node.findFirst({
    where: {
      id: collectionId,
      type: NodeType.FOLDER,
      icon: BOOK_COLLECTION_ICON,
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: userId },
          { workspaceMembers: { some: { userId } } },
        ],
      },
    },
    include: {
      workspace: {
        select: {
          ownerId: true,
          name: true,
          workspaceMembers: {
            where: { userId },
            select: { role: true },
            take: 1,
          },
        },
      },
      children: {
        where: {
          type: NodeType.PAGE,
          isArchived: false,
        },
        include: {
          pageContent: true,
        },
        orderBy: [
          { position: "asc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!collection) return null;

  const currentRole =
    collection.workspace.ownerId === userId
      ? WorkspaceRole.OWNER
      : collection.workspace.workspaceMembers[0]?.role;
  const canEdit =
    currentRole === WorkspaceRole.OWNER ||
    currentRole === WorkspaceRole.ADMIN ||
    currentRole === WorkspaceRole.MEMBER;

  const volumes = await Promise.all(
    collection.children.map(async (volume) => ({
      id: volume.id,
      title: await decryptUserData(
        collection.workspace.ownerId,
        `node:${volume.id}:title`,
        volume.title,
      ),
      kind: isPdfBookContent(volume.pageContent?.contentJson)
        ? ("pdf" as const)
        : ("html" as const),
      updatedAt: (
        volume.pageContent && volume.pageContent.updatedAt > volume.updatedAt
          ? volume.pageContent.updatedAt
          : volume.updatedAt
      ).toISOString(),
    })),
  );

  return {
    id: collection.id,
    workspaceId: collection.workspaceId,
    title: await decryptUserData(
      collection.workspace.ownerId,
      `node:${collection.id}:title`,
      collection.title,
    ),
    workspaceName: collection.workspace.name,
    canEdit,
    volumes,
  };
}

export async function getBookReaderVolume(
  userId: string,
  collectionId: string,
  volumeId: string,
): Promise<BookReaderVolume | null> {
  const volume = await prisma.node.findFirst({
    where: {
      id: volumeId,
      parentId: collectionId,
      type: NodeType.PAGE,
      isArchived: false,
      parent: {
        type: NodeType.FOLDER,
        icon: BOOK_COLLECTION_ICON,
        isArchived: false,
      },
      workspace: {
        OR: [
          { ownerId: userId },
          { workspaceMembers: { some: { userId } } },
        ],
      },
    },
    include: {
      pageContent: true,
      parent: true,
      workspace: {
        select: {
          ownerId: true,
          workspaceMembers: {
            where: { userId },
            select: { role: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!volume || !volume.parent) return null;

  const pdfContent = isPdfBookContent(volume.pageContent?.contentJson)
    ? volume.pageContent.contentJson
    : null;
  const content = pdfContent
    ? ""
    : await decryptUserData(
        volume.workspace.ownerId,
        `node:${volume.id}:content`,
        volume.pageContent?.contentText,
      ).then(sanitizePageContent);
  const currentRole =
    volume.workspace.ownerId === userId
      ? WorkspaceRole.OWNER
      : volume.workspace.workspaceMembers[0]?.role;
  const canEdit =
    currentRole === WorkspaceRole.OWNER ||
    currentRole === WorkspaceRole.ADMIN ||
    currentRole === WorkspaceRole.MEMBER;

  return {
    id: volume.id,
    workspaceId: volume.workspaceId,
    collectionId: volume.parent.id,
    collectionTitle: await decryptUserData(
      volume.workspace.ownerId,
      `node:${volume.parent.id}:title`,
      volume.parent.title,
    ),
    title: await decryptUserData(
      volume.workspace.ownerId,
      `node:${volume.id}:title`,
      volume.title,
    ),
    kind: pdfContent ? "pdf" : "html",
    canEdit,
    content,
    pdfUrl: pdfContent ? `/api/books/${volume.id}/pdf` : null,
    updatedAt: (
      volume.pageContent && volume.pageContent.updatedAt > volume.updatedAt
        ? volume.pageContent.updatedAt
        : volume.updatedAt
    ).toISOString(),
  };
}

export async function createBookCollection(input: CreateBookCollectionInput) {
  const session = await auth();
  const userId = session?.user?.id;
  const title = input.title.trim();

  if (!userId) return { error: "You must be signed in." };
  if (!title || title.length > 100) {
    return { error: "Collection name must be between 1 and 100 characters." };
  }

  const workspace = await canEditWorkspace(userId, input.workspaceId);

  if (!workspace) {
    return { error: "You do not have permission to edit this workspace." };
  }

  const lastSibling = await prisma.node.findFirst({
    where: {
      workspaceId: input.workspaceId,
      parentId: null,
      isArchived: false,
    },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const collectionId = randomUUID();
  const encryptedTitle = await encryptUserData(
    workspace.ownerId,
    `node:${collectionId}:title`,
    title,
  );

  await prisma.node.create({
    data: {
      id: collectionId,
      title: encryptedTitle,
      type: NodeType.FOLDER,
      workspaceId: input.workspaceId,
      createdById: userId,
      position: (lastSibling?.position ?? -1) + 1,
      icon: BOOK_COLLECTION_ICON,
    },
  });

  revalidatePath("/book");
  revalidatePath("/home", "layout");

  return { collection: { id: collectionId } };
}

export async function createBookHtmlVolume(input: CreateBookVolumeInput) {
  const session = await auth();
  const userId = session?.user?.id;
  const title = input.title.trim();

  if (!userId) return { error: "You must be signed in." };
  if (!title || title.length > 100) {
    return { error: "Volume title must be between 1 and 100 characters." };
  }

  const result = await getBookCollectionForEdit(
    userId,
    input.workspaceId,
    input.collectionId,
  );

  if (!result) {
    return { error: "Book collection was not found." };
  }

  const volumeId = randomUUID();
  const [encryptedTitle, encryptedContent, position] = await Promise.all([
    encryptUserData(result.workspace.ownerId, `node:${volumeId}:title`, title),
    encryptUserData(result.workspace.ownerId, `node:${volumeId}:content`, ""),
    getLastVolumePosition(input.workspaceId, input.collectionId),
  ]);

  await prisma.node.create({
    data: {
      id: volumeId,
      title: encryptedTitle,
      type: NodeType.PAGE,
      workspaceId: input.workspaceId,
      parentId: input.collectionId,
      createdById: userId,
      position,
      icon: BOOK_HTML_ICON,
      pageContent: {
        create: {
          format: PageContentFormat.HTML,
          contentText: encryptedContent,
        },
      },
    },
  });

  revalidatePath(`/book/${input.collectionId}`);
  revalidatePath("/home", "layout");

  return { volume: { id: volumeId } };
}

export async function importBookPdf(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const collectionId = String(formData.get("collectionId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  if (!userId) return { error: "You must be signed in." };
  if (!title || title.length > 100) {
    return { error: "Volume title must be between 1 and 100 characters." };
  }

  if (!(file instanceof File)) {
    return { error: "Choose a PDF file to import." };
  }

  const result = await getBookCollectionForEdit(
    userId,
    workspaceId,
    collectionId,
  );

  if (!result) {
    return { error: "Book collection was not found." };
  }

  try {
    const [storedPdf, position] = await Promise.all([
      storeBookPdf(file),
      getLastVolumePosition(workspaceId, collectionId),
    ]);
    const volumeId = randomUUID();
    const encryptedTitle = await encryptUserData(
      result.workspace.ownerId,
      `node:${volumeId}:title`,
      title,
    );
    const contentJson = {
      kind: "book-pdf",
      pdfRef: storedPdf.reference,
      originalName: file.name,
      size: file.size,
    } satisfies Prisma.InputJsonObject;

    await prisma.node.create({
      data: {
        id: volumeId,
        title: encryptedTitle,
        type: NodeType.PAGE,
        workspaceId,
        parentId: collectionId,
        createdById: userId,
        position,
        icon: BOOK_PDF_ICON,
        pageContent: {
          create: {
            format: PageContentFormat.JSON,
            contentJson,
          },
        },
      },
    });

    revalidatePath(`/book/${collectionId}`);
    revalidatePath("/home", "layout");

    return { volume: { id: volumeId } };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to import PDF.",
    };
  }
}

export async function deleteBookCollection(input: DeleteBookCollectionInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: "You must be signed in." };

  const result = await getBookCollectionForEdit(
    userId,
    input.workspaceId,
    input.collectionId,
  );

  if (!result) {
    return { error: "Book collection was not found." };
  }

  const archivedNodeIds = await prisma.$transaction(async (tx) => {
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
    const ids = [
      ...collectDescendantIds(
        input.collectionId,
        buildChildrenByParentId(workspaceNodes),
      ),
    ];

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

  revalidatePath("/book");
  revalidatePath("/home", "layout");

  return { archivedNodeIds };
}

export async function deleteBookVolume(input: DeleteBookVolumeInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: "You must be signed in." };

  const result = await getBookCollectionForEdit(
    userId,
    input.workspaceId,
    input.collectionId,
  );

  if (!result) {
    return { error: "Book collection was not found." };
  }

  const updateResult = await prisma.node.updateMany({
    where: {
      id: input.volumeId,
      workspaceId: input.workspaceId,
      parentId: input.collectionId,
      type: NodeType.PAGE,
      isArchived: false,
    },
    data: {
      isArchived: true,
    },
  });

  if (updateResult.count === 0) {
    return { error: "Book volume was not found." };
  }

  revalidatePath(`/book/${input.collectionId}`);
  revalidatePath("/book");
  revalidatePath("/home", "layout");

  return { archivedNodeIds: [input.volumeId] };
}
