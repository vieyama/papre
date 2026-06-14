-- CreateEnum
CREATE TYPE "PageShareVisibility" AS ENUM ('INVITED', 'PUBLIC');

-- CreateTable
CREATE TABLE "PageShare" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "visibility" "PageShareVisibility" NOT NULL DEFAULT 'INVITED',
    "tokenHash" TEXT NOT NULL,
    "tokenEncrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageShareInvite" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageShareInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageShare_nodeId_key" ON "PageShare"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PageShare_tokenHash_key" ON "PageShare"("tokenHash");

-- CreateIndex
CREATE INDEX "PageShare_visibility_idx" ON "PageShare"("visibility");

-- CreateIndex
CREATE INDEX "PageShareInvite_userId_idx" ON "PageShareInvite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PageShareInvite_shareId_userId_key"
ON "PageShareInvite"("shareId", "userId");

-- AddForeignKey
ALTER TABLE "PageShare"
ADD CONSTRAINT "PageShare_nodeId_fkey"
FOREIGN KEY ("nodeId") REFERENCES "Node"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageShareInvite"
ADD CONSTRAINT "PageShareInvite_shareId_fkey"
FOREIGN KEY ("shareId") REFERENCES "PageShare"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageShareInvite"
ADD CONSTRAINT "PageShareInvite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
