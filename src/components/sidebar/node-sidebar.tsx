"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const [isPending, startTransition] = React.useTransition();

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
  const tree = React.useMemo(() => buildNodeTree(nodes), [nodes]);


  function handleCreate(type: NodeType, parentId?: string) {
    startTransition(async () => {
      const result = await createNode({ workspaceId, parentId, type });

      if (result.node) {
        router.push(`/home/${result.node.id}`);
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
            <SidebarMenuButton asChild isActive={pathname === "/home"}>
              <Link href="/home">
                <HomeIcon />
                <span>Beranda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/book"}>
              <Link href="/book">
                <BookHeart />
                <span>Book</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/calendar"}>
              <Link href="/calendar">
                <CalendarDaysIcon />
                <span>Kalender</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Page</SidebarGroupLabel>
        {canEdit && (
          <>
            <SidebarGroupAction
              type="button"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.FOLDER)}
              className="right-9 cursor-pointer"
              title="Add folder"
            >
              <FolderPlusIcon />
              <span className="sr-only">Add folder</span>
            </SidebarGroupAction>
            <SidebarGroupAction
              type="button"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.PAGE)}
              title="Add page"
              className="cursor-pointer"
            >
              <FilePlus2Icon />
              <span className="sr-only">Add page</span>
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
              No pages yet
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
