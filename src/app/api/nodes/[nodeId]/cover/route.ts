import { Readable } from "node:stream";
import { auth } from "@/auth";
import { WorkspaceRole } from "@/generated/prisma/client";
import {
  ensureMinioBucket,
  getMinioObjectKey,
  minioBucket,
  minioClient,
  optimizeAndStoreCover,
} from "@/lib/minio";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

async function getAccessibleNode(nodeId: string, userId: string) {
  return prisma.node.findFirst({
    where: {
      id: nodeId,
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
      coverImage: true,
    },
  });
}

async function canEditNode(nodeId: string, userId: string) {
  return prisma.node.findFirst({
    where: {
      id: nodeId,
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: userId },
          {
            workspaceMembers: {
              some: {
                userId,
                role: {
                  in: [
                    WorkspaceRole.OWNER,
                    WorkspaceRole.ADMIN,
                    WorkspaceRole.MEMBER,
                  ],
                },
              },
            },
          },
        ],
      },
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { nodeId } = await params;
  const node = await getAccessibleNode(nodeId, userId);
  const objectKey = getMinioObjectKey(node?.coverImage ?? null);

  if (!node || !objectKey) {
    return new Response("Cover not found", { status: 404 });
  }

  await ensureMinioBucket();

  try {
    const [stat, objectStream] = await Promise.all([
      minioClient.statObject(minioBucket, objectKey),
      minioClient.getObject(minioBucket, objectKey),
    ]);

    return new Response(
      Readable.toWeb(objectStream) as ReadableStream<Uint8Array>,
      {
        headers: {
          "Cache-Control": "private, max-age=3600",
          "Content-Length": String(stat.size),
          "Content-Type":
            String(stat.metaData?.["content-type"] ?? "image/webp"),
          ETag: stat.etag,
        },
      },
    );
  } catch {
    return new Response("Cover not found", { status: 404 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nodeId } = await params;
  const node = await canEditNode(nodeId, userId);

  if (!node) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "Cover image is required." },
      { status: 400 },
    );
  }

  try {
    const storedCover = await optimizeAndStoreCover(file);

    await prisma.node.update({
      where: {
        id: node.id,
      },
      data: {
        coverImage: storedCover.reference,
      },
    });

    return Response.json({
      coverImage: `/api/nodes/${node.id}/cover?v=${encodeURIComponent(
        storedCover.objectKey,
      )}`,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload cover.",
      },
      { status: 400 },
    );
  }
}
