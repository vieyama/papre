import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import ReactQueryProvider from "@/providers"
import { WorkspaceProvider } from "@/providers/workspace-provider"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProtectedHeader } from "@/components/protected-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { getWorkspacesByUserId } from "@/services/workspace"
import { getNodesByUserId } from "@/services/node"
import { localeHref } from "@/i18n/paths"
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
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(localeHref("/login", lang))

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
              <ProtectedHeader />
              <main className="pb-14 md:pb-0">
                {children}
              </main>
              <MobileBottomNav />
            </SidebarInset>
          </SidebarProvider>
        </WorkspaceProvider>
      </TooltipProvider>
    </ReactQueryProvider>
  )
}
