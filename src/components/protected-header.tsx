"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function ProtectedHeader() {
  const { isMobile } = useSidebar();

  if (isMobile) return null;

  return (
    <header className="flex h-14 border-b border-border mb-1 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="ml-3" />
    </header>
  );
}
