import "server-only";

import { WorkspaceRole } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const EDITOR_ROLES = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.MEMBER,
] as const;

export async function getWorkspaceAccess(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      ownerId: true,
      workspaceMembers: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!workspace) return null;

  const role =
    workspace.ownerId === userId
      ? WorkspaceRole.OWNER
      : workspace.workspaceMembers[0]?.role;

  if (!role) return null;

  return {
    id: workspace.id,
    ownerId: workspace.ownerId,
    role,
    canEdit: EDITOR_ROLES.includes(role as (typeof EDITOR_ROLES)[number]),
    canManageMembers:
      role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN,
  };
}

export function canManageTargetRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
) {
  if (actorRole === WorkspaceRole.OWNER) {
    return targetRole !== WorkspaceRole.OWNER;
  }

  return (
    actorRole === WorkspaceRole.ADMIN &&
    (targetRole === WorkspaceRole.MEMBER ||
      targetRole === WorkspaceRole.VIEWER)
  );
}

export function canAssignRole(
  actorRole: WorkspaceRole,
  nextRole: WorkspaceRole,
) {
  if (actorRole === WorkspaceRole.OWNER) {
    return nextRole !== WorkspaceRole.OWNER;
  }

  return (
    actorRole === WorkspaceRole.ADMIN &&
    (nextRole === WorkspaceRole.MEMBER ||
      nextRole === WorkspaceRole.VIEWER)
  );
}
