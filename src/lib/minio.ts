import "server-only";

import { createHash } from "node:crypto";
import { Client } from "minio";
import sharp from "sharp";

const DEFAULT_BUCKET = "mydjournal";
const MAX_COVER_BYTES = 10 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const globalForMinio = globalThis as unknown as {
  minioClient?: Client;
  minioBucketReady?: Promise<void>;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

export const minioBucket = process.env.MINIO_BUCKET ?? DEFAULT_BUCKET;

export const minioClient =
  globalForMinio.minioClient ??
  new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "127.0.0.1",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: getRequiredEnv("MINIO_ACCESS_KEY"),
    secretKey: getRequiredEnv("MINIO_SECRET_KEY"),
  });

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minioClient = minioClient;
}

async function ensureBucket() {
  const exists = await minioClient.bucketExists(minioBucket);

  if (!exists) {
    await minioClient.makeBucket(minioBucket);
  }
}

export function ensureMinioBucket() {
  globalForMinio.minioBucketReady ??= ensureBucket();
  return globalForMinio.minioBucketReady;
}

export function getMinioObjectKey(coverImage: string | null) {
  const prefix = `minio://${minioBucket}/`;

  if (!coverImage?.startsWith(prefix)) {
    return null;
  }

  return coverImage.slice(prefix.length);
}

export function getMinioCoverReference(objectKey: string) {
  return `minio://${minioBucket}/${objectKey}`;
}

export async function optimizeAndStoreCover(file: File) {
  if (!ALLOWED_COVER_TYPES.has(file.type)) {
    throw new Error("Unsupported image format.");
  }

  if (file.size === 0 || file.size > MAX_COVER_BYTES) {
    throw new Error("Cover image must be between 1 byte and 10 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(input, {
    animated: false,
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: 2400,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 82,
      effort: 4,
    })
    .toBuffer();

  const hash = createHash("sha256").update(optimized).digest("hex");
  const objectKey = `covers/${hash}.webp`;

  await ensureMinioBucket();

  try {
    await minioClient.statObject(minioBucket, objectKey);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (code !== "NotFound" && code !== "NoSuchKey") {
      throw error;
    }

    await minioClient.putObject(
      minioBucket,
      objectKey,
      optimized,
      optimized.byteLength,
      {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Amz-Meta-Sha256": hash,
      },
    );
  }

  return {
    objectKey,
    reference: getMinioCoverReference(objectKey),
  };
}
