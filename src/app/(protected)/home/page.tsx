import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { WorkspaceHome } from "@/components/workspace-home";
import { getNodesByUserId } from "@/services/node";
import { getWorkspacesByUserId } from "@/services/workspace";

export const metadata: Metadata = {
  title: "Home",
  description: "Browse all pages and folders in your My Djurnal workspaces.",
}

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [workspaces, nodes] = await Promise.all([
    getWorkspacesByUserId(session.user.id),
    getNodesByUserId(session.user.id),
  ]);

  return (
    <WorkspaceHome
      userName={session.user.name}
      workspaces={workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        icon: workspace.icon,
        currentUserRole: workspace.currentUserRole,
      }))}
      nodes={nodes.map((node) => ({
        id: node.id,
        workspaceId: node.workspaceId,
        title: node.title,
        type: node.type,
        icon: node.icon,
        coverImage: node.coverImage,
        updatedAt: node.updatedAt.toISOString(),
      }))}
    />
  );
}
