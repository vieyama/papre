"use server";
import prisma from "@/lib/prisma";
import { WorkspaceRole, type Workspace } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  canAssignRole,
  canManageTargetRole,
  getWorkspaceAccess,
} from "@/lib/workspace-access";

export type WorkspaceSummary = Workspace & {
  currentUserRole: WorkspaceRole;
  memberCount: number;
};

export async function getWorkspacesByUserId(
  userId: string,
): Promise<WorkspaceSummary[]> {
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { workspaceMembers: { some: { userId } } },
      ],
    },
    include: {
      workspaceMembers: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
      _count: {
        select: {
          workspaceMembers: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return workspaces.map(({ workspaceMembers, _count, ...workspace }) => ({
    ...workspace,
    currentUserRole:
      workspace.ownerId === userId
        ? WorkspaceRole.OWNER
        : (workspaceMembers[0]?.role ?? WorkspaceRole.VIEWER),
    memberCount: _count.workspaceMembers,
  }));
}

export type CreateWorkspaceResult = {
  error?: string;
  success?: true;
};

export async function createWorkspace(name: string, icon?: string): Promise<CreateWorkspaceResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in to create a workspace." };
  }

  try {
    await prisma.workspace.create({
      data: {
        name,
        icon,
        ownerId: session.user.id,
        workspaceMembers: {
          create: {
            userId: session.user.id,
            role: WorkspaceRole.OWNER,
          },
        },
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creating workspace:", error);
    return { error: "Failed to create workspace. Please try again." };
  }
}

export async function getWorkspaceMembers(workspaceId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in." };
  }

  const access = await getWorkspaceAccess(userId, workspaceId);

  if (!access?.canManageMembers) {
    return { error: "You cannot manage members in this workspace." };
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      id: true,
      userId: true,
      role: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "asc" },
    ],
  });

  return {
    members,
    currentUserRole: access.role,
    canManageMembers: access.canManageMembers,
  };
}

export async function addWorkspaceMember(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const email = input.email.trim().toLowerCase();

  if (!userId) {
    return { error: "You must be signed in." };
  }

  if (!email || email.length > 320) {
    return { error: "Enter a valid email address." };
  }

  if (!Object.values(WorkspaceRole).includes(input.role)) {
    return { error: "Invalid workspace role." };
  }

  const access = await getWorkspaceAccess(userId, input.workspaceId);

  if (
    !access?.canManageMembers ||
    !canAssignRole(access.role, input.role)
  ) {
    return { error: "You cannot assign this workspace role." };
  }

  const targetUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!targetUser) {
    return { error: "No registered user was found with this email." };
  }

  if (targetUser.id === access.ownerId) {
    return { error: "The workspace owner is already a member." };
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: input.workspaceId,
        userId: targetUser.id,
      },
    },
    select: { id: true },
  });

  if (existingMember) {
    return { error: "This user is already a workspace member." };
  }

  await prisma.workspaceMember.create({
    data: {
      workspaceId: input.workspaceId,
      userId: targetUser.id,
      role: input.role,
    },
  });

  revalidatePath("/home", "layout");
  revalidatePath("/calendar");

  return { success: true as const };
}

export async function updateWorkspaceMemberRole(input: {
  workspaceId: string;
  memberId: string;
  role: WorkspaceRole;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in." };
  }

  if (!Object.values(WorkspaceRole).includes(input.role)) {
    return { error: "Invalid workspace role." };
  }

  const access = await getWorkspaceAccess(userId, input.workspaceId);
  const target = await prisma.workspaceMember.findFirst({
    where: {
      id: input.memberId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
    },
  });

  if (
    !access?.canManageMembers ||
    !target ||
    target.userId === access.ownerId ||
    !canManageTargetRole(access.role, target.role) ||
    !canAssignRole(access.role, input.role)
  ) {
    return { error: "You cannot change this member's role." };
  }

  await prisma.workspaceMember.update({
    where: { id: target.id },
    data: { role: input.role },
  });

  revalidatePath("/home", "layout");
  revalidatePath("/calendar");

  return { success: true as const };
}

export async function removeWorkspaceMember(input: {
  workspaceId: string;
  memberId: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in." };
  }

  const access = await getWorkspaceAccess(userId, input.workspaceId);
  const target = await prisma.workspaceMember.findFirst({
    where: {
      id: input.memberId,
      workspaceId: input.workspaceId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
    },
  });

  if (
    !access?.canManageMembers ||
    !target ||
    target.userId === access.ownerId ||
    !canManageTargetRole(access.role, target.role)
  ) {
    return { error: "You cannot remove this workspace member." };
  }

  await prisma.workspaceMember.delete({
    where: { id: target.id },
  });

  revalidatePath("/home", "layout");
  revalidatePath("/calendar");

  return { success: true as const };
}
