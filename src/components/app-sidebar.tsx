"use client"

import * as React from "react"

import { NavUser } from "@/components/nav-user"
import { NodeSidebar } from "@/components/node-sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Session } from "next-auth"
import type { Node } from "@/generated/prisma/browser"
import type { WorkspaceSummary } from "@/services/workspace"
import { WorkspaceSwitcherClient } from "./workspace-switcher-client"
import { useWorkspaceStore } from "@/stores/workspace"

export function AppSidebar({
  session,
  workspaces,
  nodes,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session?: Session;
  workspaces?: WorkspaceSummary[];
  nodes?: Node[];
}) {
  const fallbackUser = {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  };

  const {
    selectedWorkspace,
    hasHydrated,
    setSelectedWorkspace,
  } = useWorkspaceStore();

  const validWorkspaces = workspaces || [];
  const initialWorkspace = validWorkspaces.length > 0 
    ? validWorkspaces.find((w) => w.id === selectedWorkspace?.id) ?? validWorkspaces[0] 
    : null;

  React.useEffect(() => {
    if (!hasHydrated) return;

    if (!initialWorkspace) {
      if (selectedWorkspace) setSelectedWorkspace(null);
      return;
    }

    if (selectedWorkspace !== initialWorkspace) {
      setSelectedWorkspace(initialWorkspace);
    }
  }, [
    hasHydrated,
    initialWorkspace,
    selectedWorkspace,
    setSelectedWorkspace,
  ]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {initialWorkspace && (
          <WorkspaceSwitcherClient
            workspaces={validWorkspaces}
            initialWorkspace={initialWorkspace}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        {initialWorkspace && (
          <NodeSidebar
            workspaceId={initialWorkspace.id}
            canEdit={initialWorkspace.currentUserRole !== "VIEWER"}
            nodes={(nodes || []).filter(
              (node) => node.workspaceId === initialWorkspace.id,
            )}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user || fallbackUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
