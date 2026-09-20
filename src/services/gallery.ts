"use server";

import { auth } from "@/auth";
import {
  PageContentFormat,
  Prisma,
  StoredAssetKind,
} from "@/generated/prisma/client";
import { decryptUserData, encryptUserData } from "@/lib/data-encryption";
import {
  getMinioObjectKey,
  minioBucket,
  minioClient,
  removeMinioObject,
} from "@/lib/minio";
import prisma from "@/lib/prisma";
import { sanitizePageContent } from "@/lib/sanitize-page-content";

export type GalleryAsset = {
  id: string;
  bucket: string;
  folder: string;
  kind: StoredAssetKind;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
};

function getPdfReference(value: Prisma.JsonValue | null) {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    value.kind === "book-pdf" &&
    typeof value.pdfRef === "string"
  ) {
    return {
      reference: value.pdfRef,
      originalName:
        typeof value.originalName === "string" ? value.originalName : null,
      size: typeof value.size === "number" ? value.size : 0,
    };
  }

  return null;
}

async function discoverExistingAssets(userId: string) {
  const nodes = await prisma.node.findMany({
    where: { workspace: { ownerId: userId } },
    select: {
      id: true,
      coverImage: true,
      pageContent: {
        select: { contentJson: true, contentText: true },
      },
      workspace: { select: { ownerId: true } },
    },
  });
  const discovered = new Map<
    string,
    {
      userId: string;
      nodeId: string;
      objectKey: string;
      kind: StoredAssetKind;
      originalName: string | null;
      mimeType: string;
      size: number;
    }
  >();

  for (const node of nodes) {
    const coverKey = getMinioObjectKey(node.coverImage);
    if (coverKey) {
      discovered.set(`${node.id}:${coverKey}`, {
        userId,
        nodeId: node.id,
        objectKey: coverKey,
        kind: StoredAssetKind.COVER_IMAGE,
        originalName: null,
        mimeType: "image/webp",
        size: 0,
      });
    }

    const pdf = getPdfReference(node.pageContent?.contentJson ?? null);
    const pdfKey = getMinioObjectKey(pdf?.reference ?? null);
    if (pdf && pdfKey) {
      discovered.set(`${node.id}:${pdfKey}`, {
        userId,
        nodeId: node.id,
        objectKey: pdfKey,
        kind: StoredAssetKind.BOOK_PDF,
        originalName: pdf.originalName,
        mimeType: "application/pdf",
        size: pdf.size,
      });
    }

    if (!node.pageContent?.contentText) continue;

    const content = await decryptUserData(
      node.workspace.ownerId,
      `node:${node.id}:content`,
      node.pageContent.contentText,
    );
    const pattern = new RegExp(
      `/api/nodes/${node.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/images/([^\\s\"'<>?#]+)`,
      "g",
    );

    for (const match of content.matchAll(pattern)) {
      const objectKey = `content/${match[1]}`;
      discovered.set(`${node.id}:${objectKey}`, {
        userId,
        nodeId: node.id,
        objectKey,
        kind: StoredAssetKind.CONTENT_IMAGE,
        originalName: null,
        mimeType: "image/*",
        size: 0,
      });
    }
  }

  if (discovered.size > 0) {
    await prisma.storedAsset.createMany({
      data: [...discovered.values()],
      skipDuplicates: true,
    });
  }
}

export async function getGalleryAssets(userId: string): Promise<GalleryAsset[]> {
  await discoverExistingAssets(userId);
  const assets = await prisma.storedAsset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    assets.map(async (asset) => {
      let size = asset.size;
      let mimeType = asset.mimeType;
      let createdAt = asset.createdAt;

      try {
        const stat = await minioClient.statObject(minioBucket, asset.objectKey);
        size = stat.size;
        mimeType = String(stat.metaData?.["content-type"] ?? mimeType);
        createdAt = stat.lastModified ?? createdAt;
      } catch {
        // Keep the indexed metadata so a missing object can still be removed.
      }

      return {
        id: asset.id,
        bucket: minioBucket,
        folder: asset.objectKey.includes("/")
          ? asset.objectKey.slice(0, asset.objectKey.lastIndexOf("/"))
          : "/",
        kind: asset.kind,
        name: asset.originalName || asset.objectKey.split("/").at(-1) || "File",
        mimeType,
        size,
        createdAt: createdAt.toISOString(),
        url: `/api/gallery/${asset.id}`,
      };
    }),
  );
}

function removeImageFromContent(content: string, nodeId: string, objectKey: string) {
  const imageKey = objectKey.slice("content/".length);
  const source = `/api/nodes/${nodeId}/images/${imageKey}`;
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.replace(
    new RegExp(`<img\\b(?=[^>]*\\bsrc=(['"])${escaped}\\1)[^>]*>`, "gi"),
    "",
  );
}

export async function deleteGalleryAsset(assetId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Unauthorized" };

  const asset = await prisma.storedAsset.findFirst({
    where: { id: assetId, userId },
  });
  if (!asset) return { error: "File not found." };

  const reference = `minio://${minioBucket}/${asset.objectKey}`;

  if (asset.kind === StoredAssetKind.COVER_IMAGE) {
    await prisma.node.updateMany({
      where: {
        id: asset.nodeId,
        coverImage: reference,
        OR: [{ createdById: userId }, { workspace: { ownerId: userId } }],
      },
      data: { coverImage: null },
    });
  }

  if (asset.kind === StoredAssetKind.BOOK_PDF && asset.nodeId) {
    const node = await prisma.node.findFirst({
      where: {
        id: asset.nodeId,
        OR: [{ createdById: userId }, { workspace: { ownerId: userId } }],
      },
      select: { id: true, workspace: { select: { ownerId: true } } },
    });
    if (node) {
      const encryptedEmptyContent = await encryptUserData(
        node.workspace.ownerId,
        `node:${node.id}:content`,
        "",
      );
      await prisma.pageContent.updateMany({
        where: { nodeId: node.id },
        data: {
          format: PageContentFormat.HTML,
          contentJson: Prisma.DbNull,
          contentText: encryptedEmptyContent,
        },
      });
    }
  }

  if (asset.kind === StoredAssetKind.CONTENT_IMAGE && asset.nodeId) {
    const node = await prisma.node.findFirst({
      where: {
        id: asset.nodeId,
        OR: [{ createdById: userId }, { workspace: { ownerId: userId } }],
      },
      select: {
        id: true,
        pageContent: { select: { contentText: true } },
        workspace: { select: { ownerId: true } },
      },
    });
    if (node?.pageContent?.contentText) {
      const content = await decryptUserData(
        node.workspace.ownerId,
        `node:${node.id}:content`,
        node.pageContent.contentText,
      );
      const nextContent = sanitizePageContent(
        removeImageFromContent(content, node.id, asset.objectKey),
      );
      await prisma.pageContent.update({
        where: { nodeId: node.id },
        data: {
          contentText: await encryptUserData(
            node.workspace.ownerId,
            `node:${node.id}:content`,
            nextContent,
          ),
        },
      });
    }
  }

  const otherReferences = await prisma.storedAsset.count({
    where: { objectKey: asset.objectKey, id: { not: asset.id } },
  });

  if (otherReferences === 0) {
    try {
      await removeMinioObject(asset.objectKey);
    } catch {
      return { error: "The file could not be removed from storage. Please try again." };
    }
  }

  await prisma.storedAsset.delete({ where: { id: asset.id } });

  return { success: true as const };
}
