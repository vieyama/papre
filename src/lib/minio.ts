import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Client } from "minio";
import sharp from "sharp";

const DEFAULT_BUCKET = "papre";
const MAX_COVER_BYTES = 10 * 1024 * 1024;
const MAX_BOOK_PDF_BYTES = 100 * 1024 * 1024;
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
  if (!globalForMinio.minioBucketReady) {
    globalForMinio.minioBucketReady = ensureBucket().catch((error) => {
      globalForMinio.minioBucketReady = undefined;
      throw error;
    });
  }

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

export function getMinioBookPdfReference(objectKey: string) {
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

export async function storeBookPdf(file: File) {
  const fileName = file.name.trim();
  const isPdf =
    file.type === "application/pdf" ||
    fileName.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Only PDF files can be imported.");
  }

  if (file.size === 0 || file.size > MAX_BOOK_PDF_BYTES) {
    throw new Error("PDF file must be between 1 byte and 100 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectKey = `books/${randomUUID()}.pdf`;

  await ensureMinioBucket();
  
  await minioClient.putObject(
    minioBucket,
    objectKey,
    buffer,
    buffer.byteLength,
    {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, max-age=3600",
    },
  );

  return {
    objectKey,
    reference: getMinioBookPdfReference(objectKey),
  };
}
