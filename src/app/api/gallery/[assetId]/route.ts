import { Readable } from "node:stream";
import { auth } from "@/auth";
import { minioBucket, minioClient } from "@/lib/minio";
import prisma from "@/lib/prisma";
import { deleteGalleryAsset } from "@/services/gallery";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { assetId } = await params;
  const asset = await prisma.storedAsset.findFirst({
    where: { id: assetId, userId: session.user.id },
  });
  if (!asset) return new Response("File not found", { status: 404 });

  try {
    const [stat, stream] = await Promise.all([
      minioClient.statObject(minioBucket, asset.objectKey),
      minioClient.getObject(minioBucket, asset.objectKey),
    ]);

    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(stat.size),
        "Content-Type": String(stat.metaData?.["content-type"] ?? asset.mimeType),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.originalName ?? "file")}`,
        ETag: stat.etag,
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  const result = await deleteGalleryAsset(assetId);
  return Response.json(result, { status: result.error ? 400 : 200 });
}
