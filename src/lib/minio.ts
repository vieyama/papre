import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Client } from "minio";
import sharp from "sharp";
import {
  MAX_BOOK_PDF_BYTES,
  MAX_CONTENT_IMAGE_BYTES,
  MAX_COVER_BYTES,
} from "@/lib/upload-security";

const DEFAULT_BUCKET = "papre";
const ALLOWED_COVER_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const CONTENT_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

export function getMinioContentImageReference(objectKey: string) {
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
  assertImageMagicBytes(input, file.type);

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

export async function storeContentImage(file: File) {
  const extension = CONTENT_IMAGE_EXTENSIONS[file.type];

  if (!extension) {
    throw new Error("Unsupported image format.");
  }

  if (file.size === 0 || file.size > MAX_CONTENT_IMAGE_BYTES) {
    throw new Error("Image must be between 1 byte and 20 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  assertImageMagicBytes(buffer, file.type);

  const hash = createHash("sha256").update(buffer).digest("hex");
  const objectKey = `content/${hash}.${extension}`;

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
      buffer,
      buffer.byteLength,
      {
        "Content-Type": file.type,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Amz-Meta-Sha256": hash,
      },
    );
  }

  return {
    objectKey,
    reference: getMinioContentImageReference(objectKey),
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

  if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error("Only valid PDF files can be imported.");
  }

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

function assertImageMagicBytes(buffer: Buffer, contentType: string) {
  const isValid =
    (contentType === "image/avif" &&
      buffer.subarray(4, 12).equals(Buffer.from("ftypavif"))) ||
    (contentType === "image/gif" &&
      (buffer.subarray(0, 6).equals(Buffer.from("GIF87a")) ||
        buffer.subarray(0, 6).equals(Buffer.from("GIF89a")))) ||
    (contentType === "image/jpeg" &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff) ||
    (contentType === "image/png" &&
      buffer
        .subarray(0, 8)
        .equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        )) ||
    (contentType === "image/webp" &&
      buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
      buffer.subarray(8, 12).equals(Buffer.from("WEBP")));

  if (!isValid) {
    throw new Error("Uploaded image content does not match its file type.");
  }
}
