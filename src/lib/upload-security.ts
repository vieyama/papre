import "server-only";

export const MAX_COVER_BYTES = 10 * 1024 * 1024;
export const MAX_BOOK_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_CONTENT_IMAGE_BYTES = 20 * 1024 * 1024;
export const MULTIPART_OVERHEAD_BYTES = 512 * 1024;

type UploadKind = "book-pdf" | "content-image" | "cover-image";

type RateLimitRule = {
  maxAttempts: number;
  windowMs: number;
};

export class UploadTooLargeError extends Error {}
export class UploadRateLimitError extends Error {}

const RATE_LIMITS: Record<UploadKind, RateLimitRule> = {
  "book-pdf": { maxAttempts: 6, windowMs: 60 * 60 * 1000 },
  "content-image": { maxAttempts: 40, windowMs: 10 * 60 * 1000 },
  "cover-image": { maxAttempts: 20, windowMs: 10 * 60 * 1000 },
};

const buckets = new Map<string, { count: number; resetAt: number }>();

export function getUploadLimit(kind: UploadKind) {
  switch (kind) {
    case "book-pdf":
      return MAX_BOOK_PDF_BYTES;
    case "content-image":
      return MAX_CONTENT_IMAGE_BYTES;
    case "cover-image":
      return MAX_COVER_BYTES;
  }
}

export function assertRequestBodyWithinLimit(
  request: Request,
  kind: UploadKind,
) {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) return;

  const size = Number(contentLength);

  if (!Number.isSafeInteger(size) || size < 0) {
    throw new Error("Invalid upload size.");
  }

  const limit = getUploadLimit(kind) + MULTIPART_OVERHEAD_BYTES;

  if (size > limit) {
    throw new UploadTooLargeError(formatUploadLimitError(kind));
  }
}

export function assertUploadRateLimit(userId: string, kind: UploadKind) {
  const rule = RATE_LIMITS[kind];
  const now = Date.now();
  const key = `${kind}:${userId}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    pruneExpiredBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }

  if (bucket.count >= rule.maxAttempts) {
    throw new UploadRateLimitError(
      "Too many uploads. Please wait before trying again.",
    );
  }

  bucket.count += 1;
}

export function getUploadRejectionStatus(error: unknown) {
  if (error instanceof UploadTooLargeError) return 413;
  if (error instanceof UploadRateLimitError) return 429;
  return 400;
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 1000) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function formatUploadLimitError(kind: UploadKind) {
  switch (kind) {
    case "book-pdf":
      return "PDF file must be between 1 byte and 100 MB.";
    case "content-image":
      return "Image must be between 1 byte and 20 MB.";
    case "cover-image":
      return "Cover image must be between 1 byte and 10 MB.";
  }
}
