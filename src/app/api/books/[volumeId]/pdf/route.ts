import { Readable } from "node:stream";
import { auth } from "@/auth";
import { PageContentFormat } from "@/generated/prisma/client";
import {
  ensureMinioBucket,
  getMinioObjectKey,
  minioBucket,
  minioClient,
} from "@/lib/minio";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function getPdfReference(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "book-pdf" &&
    "pdfRef" in value &&
    typeof value.pdfRef === "string"
  ) {
    return value.pdfRef;
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ volumeId: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { volumeId } = await params;
  const volume = await prisma.node.findFirst({
    where: {
      id: volumeId,
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: userId },
          { workspaceMembers: { some: { userId } } },
        ],
      },
    },
    select: {
      pageContent: {
        select: {
          format: true,
          contentJson: true,
        },
      },
    },
  });

  if (volume?.pageContent?.format !== PageContentFormat.JSON) {
    return new Response("PDF not found", { status: 404 });
  }

  const objectKey = getMinioObjectKey(
    getPdfReference(volume.pageContent.contentJson),
  );

  if (!objectKey) {
    return new Response("PDF not found", { status: 404 });
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
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
          ETag: stat.etag,
        },
      },
    );
  } catch {
    return new Response("PDF not found", { status: 404 });
  }
}
