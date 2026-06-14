import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { WorkspaceCalendar } from "@/components/workspace-calendar";
import { getCalendarPagesByUserId } from "@/services/node";
import { getWorkspacesByUserId } from "@/services/workspace";

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [workspaces, pages] = await Promise.all([
    getWorkspacesByUserId(session.user.id),
    getCalendarPagesByUserId(session.user.id),
  ]);

  return (
    <WorkspaceCalendar
      workspaces={workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        icon: workspace.icon,
        currentUserRole: workspace.currentUserRole,
      }))}
      pages={pages}
    />
  );
}
