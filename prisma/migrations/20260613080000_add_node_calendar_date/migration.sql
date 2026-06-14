-- AlterTable
ALTER TABLE "Node" ADD COLUMN "calendarDate" DATE;

-- CreateIndex
CREATE INDEX "Node_workspaceId_type_calendarDate_idx"
ON "Node"("workspaceId", "type", "calendarDate");
