import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageList } from "@/components/page-list";
import { getNodesByUserId } from "@/services/node";
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
    title: dict.pagesRoute.metaTitle,
    description: dict.pagesRoute.metaDescription,
  };
}

export default async function PagesPage({
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

  const [workspaces, nodes] = await Promise.all([
    getWorkspacesByUserId(session.user.id),
    getNodesByUserId(session.user.id),
  ]);

  return (
    <PageList
      workspaces={workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        icon: workspace.icon,
        currentUserRole: workspace.currentUserRole,
      }))}
      nodes={nodes.map((node) => ({
        id: node.id,
        workspaceId: node.workspaceId,
        parentId: node.parentId,
        title: node.title,
        type: node.type,
        icon: node.icon,
        coverImage: node.coverImage,
        updatedAt: node.updatedAt.toISOString(),
      }))}
    />
  );
}
