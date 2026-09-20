CREATE TYPE "StoredAssetKind" AS ENUM ('COVER_IMAGE', 'CONTENT_IMAGE', 'BOOK_PDF');

CREATE TABLE "StoredAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "kind" "StoredAssetKind" NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredAsset_userId_nodeId_objectKey_key" ON "StoredAsset"("userId", "nodeId", "objectKey");
CREATE INDEX "StoredAsset_userId_createdAt_idx" ON "StoredAsset"("userId", "createdAt");
CREATE INDEX "StoredAsset_objectKey_idx" ON "StoredAsset"("objectKey");
CREATE INDEX "StoredAsset_nodeId_idx" ON "StoredAsset"("nodeId");

ALTER TABLE "StoredAsset" ADD CONSTRAINT "StoredAsset_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
