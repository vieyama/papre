import "server-only";

import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { ensureUserEncryptionKey } from "@/lib/data-encryption";
import prisma from "@/lib/prisma";

const MAX_TRANSACTION_ATTEMPTS = 3;

export async function ensureUserSetup(userId: string) {
  await ensureUserEncryptionKey(userId);

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existingWorkspace = await tx.workspace.findFirst({
            where: { ownerId: userId },
          });

          if (existingWorkspace) {
            return false;
          }

          await tx.workspace.create({
            data: {
              ownerId: userId,
              name: "General",
              icon: "🏠",
              workspaceMembers: {
                create: {
                  userId,
                  role: WorkspaceRole.OWNER,
                },
              },
            },
          });

          return true;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      const isRetryableTransaction =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (
        isRetryableTransaction &&
        attempt < MAX_TRANSACTION_ATTEMPTS
      ) {
        continue;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const workspace = await prisma.workspace.findMany({
          where: {
            ownerId: userId
          }
        });

        if (workspace.length > 0) {
          return false;
        }
      }

      throw error;
    }
  }

  return false;
}
