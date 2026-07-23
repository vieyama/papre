import { auth } from "@/auth";
import { WorkspaceRole } from "@/generated/prisma/client";
import { storeContentImage } from "@/lib/minio";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

async function canEditNode(nodeId: string, userId: string) {
  return prisma.node.findFirst({
    where: {
      id: nodeId,
      isArchived: false,
      workspace: {
        OR: [
          { ownerId: userId },
          {
            workspaceMembers: {
              some: {
                userId,
                role: {
                  in: [
                    WorkspaceRole.OWNER,
                    WorkspaceRole.ADMIN,
                    WorkspaceRole.MEMBER,
                  ],
                },
              },
            },
          },
        ],
      },
    },
    select: {
      id: true,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nodeId } = await params;
  const node = await canEditNode(nodeId, userId);

  if (!node) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Image file is required." }, { status: 400 });
  }

  try {
    const stored = await storeContentImage(file);
    const imageKey = stored.objectKey.slice("content/".length);

    return Response.json({
      url: `/api/nodes/${node.id}/images/${imageKey}`,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload image.",
      },
      { status: 400 },
    );
  }
}
