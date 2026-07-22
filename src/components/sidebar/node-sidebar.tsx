"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  BookHeart,
  CalendarDaysIcon,
  FilePlus2Icon,
  FolderPlusIcon,
  HomeIcon,
} from "lucide-react";

import { NodeType, type Node } from "@/generated/prisma/browser";
import {
  createNode,
  reorderNode,
} from "@/services/node";
import { excludeBookNodes } from "@/lib/book-node";

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NodeWithChildren } from "./type";
import { NodeTreeItem } from "./node-tree-item";
import RenameNodeDialog from "./rename-node-dialog";
import MoveDialog from "./move-dialog";
import DeleteDialog from "./delete-dialog";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref, stripLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

export const ROOT_PARENT_VALUE = "__root__";

function compareNodesByPosition(a: NodeWithChildren, b: NodeWithChildren) {
  if (a.position !== b.position) {
    return a.position - b.position;
  }

  const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime();

  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return a.id.localeCompare(b.id);
}

function sortNodeTree(nodes: NodeWithChildren[]) {
  nodes.sort(compareNodesByPosition);

  for (const node of nodes) {
    sortNodeTree(node.children);
  }

  return nodes;
}

function buildNodeTree(nodes: Node[]): NodeWithChildren[] {
  const nodesById = new Map<string, NodeWithChildren>();
  const roots: NodeWithChildren[] = [];

  for (const node of nodes) {
    nodesById.set(node.id, { ...node, children: [] });
  }

  for (const node of nodesById.values()) {
    const parent = node.parentId ? nodesById.get(node.parentId) : null;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortNodeTree(roots);
}

export function NodeSidebar({
  workspaceId,
  nodes,
  canEdit,
}: {
  workspaceId: string;
  nodes: Node[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();
  const [isPending, startTransition] = React.useTransition();
  const { path: strippedPath } = stripLocale(pathname);

  const [nodeToRename, setNodeToRename] =
    React.useState<NodeWithChildren | null>(null);
  const [renameTitle, setRenameTitle] = React.useState("");
  const [renameError, setRenameError] = React.useState<string | null>(null);

  const [nodeToMove, setNodeToMove] =
    React.useState<NodeWithChildren | null>(null);
  const [moveTargetParentId, setMoveTargetParentId] = React.useState(
    ROOT_PARENT_VALUE,
  );
  const [moveError, setMoveError] = React.useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] =
    React.useState<NodeWithChildren | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const tree = React.useMemo(
    () => buildNodeTree(excludeBookNodes(nodes)),
    [nodes],
  );


  function handleCreate(type: NodeType, parentId?: string) {
    startTransition(async () => {
      const result = await createNode({ workspaceId, parentId, type });

      if (result.node) {
        router.push(localeHref(`/home/${result.node.id}`, lang));
        router.refresh();
      }
    });
  }

  function handleReorderNode(
    node: NodeWithChildren,
    direction: "up" | "down",
  ) {
    startTransition(async () => {
      const result = await reorderNode({
        workspaceId,
        nodeId: node.id,
        direction,
      });

      if (!("error" in result)) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={strippedPath === "/home"}>
              <Link href={localeHref("/home", lang)}>
                <HomeIcon />
                <span>{dict.nav.home}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={strippedPath === "/book"}>
              <Link href={localeHref("/book", lang)}>
                <BookHeart />
                <span>{dict.nav.book}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={strippedPath === "/calendar"}>
              <Link href={localeHref("/calendar", lang)}>
                <CalendarDaysIcon />
                <span>{dict.nav.calendar}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>{dict.nav.pages}</SidebarGroupLabel>
        {canEdit && (
          <>
            <SidebarGroupAction
              type="button"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.FOLDER)}
              className="right-9 cursor-pointer"
              title={dict.sidebar.addFolder}
            >
              <FolderPlusIcon />
              <span className="sr-only">{dict.sidebar.addFolder}</span>
            </SidebarGroupAction>
            <SidebarGroupAction
              type="button"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.PAGE)}
              title={dict.sidebar.addPage}
              className="cursor-pointer"
            >
              <FilePlus2Icon />
              <span className="sr-only">{dict.sidebar.addPage}</span>
            </SidebarGroupAction>
          </>
        )}

        <SidebarMenu>
          {tree.map((node, index) => (
            <NodeTreeItem
              key={node.id}
              node={node}
              canEdit={canEdit}
              canMoveUp={index > 0}
              canMoveDown={index < tree.length - 1}
              onCreate={handleCreate}
              onMoveNode={(node) => {
                setMoveError(null);
                setMoveTargetParentId(node.parentId ?? ROOT_PARENT_VALUE);
                setNodeToMove(node);
              }}
              onReorderNode={handleReorderNode}
              onRenameNode={(node) => {
                setRenameError(null);
                setRenameTitle(node.title);
                setNodeToRename(node);
              }}
              onDeleteNode={(node) => {
                setDeleteError(null);
                setNodeToDelete(node);
              }}
            />
          ))}
          {tree.length === 0 && (
            <li className="px-2 py-1 text-xs text-muted-foreground">
              {dict.sidebar.noPagesYet}
            </li>
          )}
        </SidebarMenu>
      </SidebarGroup>

      <RenameNodeDialog
        isPending={isPending}
        workspaceId={workspaceId}
        nodeToRename={nodeToRename}
        renameTitle={renameTitle}
        renameError={renameError}
        setRenameError={setRenameError}
        setRenameTitle={setRenameTitle}
        setNodeToRename={setNodeToRename}
      />

      <MoveDialog
        isPending={isPending}
        nodeToMove={nodeToMove}
        setNodeToMove={setNodeToMove}
        setMoveTargetParentId={setMoveTargetParentId}
        setMoveError={setMoveError}
        workspaceId={workspaceId}
        moveTargetParentId={moveTargetParentId}
        tree={tree}
        moveError={moveError}
      />

      <DeleteDialog
        workspaceId={workspaceId}
        nodeToDelete={nodeToDelete}
        isPending={isPending}
        setNodeToDelete={setNodeToDelete}
        setDeleteError={setDeleteError}
        deleteError={deleteError}
      />
    </>
  );
}
