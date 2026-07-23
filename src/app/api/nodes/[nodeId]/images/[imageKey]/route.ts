import { Readable } from "node:stream";
import { auth } from "@/auth";
import {
  ensureMinioBucket,
  minioBucket,
  minioClient,
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
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nodeId: string; imageKey: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { nodeId, imageKey } = await params;
  const node = await getAccessibleNode(nodeId, userId);

  if (!node) {
    return new Response("Image not found", { status: 404 });
  }

  const objectKey = `content/${imageKey}`;

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
          "Cache-Control": "private, max-age=31536000, immutable",
          "Content-Length": String(stat.size),
          "Content-Type": String(
            stat.metaData?.["content-type"] ?? "application/octet-stream",
          ),
          ETag: stat.etag,
        },
      },
    );
  } catch {
    return new Response("Image not found", { status: 404 });
  }
}
