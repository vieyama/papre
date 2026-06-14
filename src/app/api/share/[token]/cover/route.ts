import { Readable } from "node:stream";

import { auth } from "@/auth";
import {
  ensureMinioBucket,
  getMinioObjectKey,
  minioBucket,
  minioClient,
} from "@/lib/minio";
import { getSharedPageByToken } from "@/lib/page-share";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await auth();
  const result = await getSharedPageByToken(token, session?.user?.id);

  if (result.status !== "ok") {
    return new Response("Cover not found", { status: 404 });
  }

  const objectKey = getMinioObjectKey(result.page.coverImage);

  if (!objectKey) {
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
          "Content-Type": String(
            stat.metaData?.["content-type"] ?? "image/webp",
          ),
          ETag: stat.etag,
        },
      },
    );
  } catch {
    return new Response("Cover not found", { status: 404 });
  }
}
