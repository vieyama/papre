import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import ReactQueryProvider from "@/providers"
import { WorkspaceProvider } from "@/providers/workspace-provider"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getWorkspacesByUserId } from "@/services/workspace"
import { getNodesByUserId } from "@/services/node"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const [workspaces, nodes] = await Promise.all([
    getWorkspacesByUserId(session.user.id),
    getNodesByUserId(session.user.id),
  ])
  
  return (
    <ReactQueryProvider>
      <TooltipProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <AppSidebar
              session={session}
              workspaces={workspaces}
              nodes={nodes}
            />
            <SidebarInset>
              <header className="flex h-14 border-b border-border mb-1 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <SidebarTrigger className="ml-3" />
              </header>
              <main>
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </WorkspaceProvider>
      </TooltipProvider>
    </ReactQueryProvider>
  )
}
