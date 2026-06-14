-- DropIndex
DROP INDEX "Workspace_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_ownerId_name_key"
ON "Workspace"("ownerId", "name");
