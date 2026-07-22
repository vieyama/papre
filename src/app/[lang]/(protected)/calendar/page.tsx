import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { WorkspaceCalendar } from "@/components/workspace-calendar";
import { getCalendarPagesByUserId } from "@/services/node";
import { getWorkspacesByUserId } from "@/services/workspace";
import { getDictionary, hasLocale } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/paths";
import { defaultLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    title: dict.calendar.metaTitle,
    description: dict.calendar.metaDescription,
  };
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(localeHref("/login", locale));
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
