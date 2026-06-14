"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  FilePlus2Icon,
  FolderPlusIcon,
  HomeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { NodeType, type Node } from "@/generated/prisma/browser";
import { createNode, deleteNode, renameNode } from "@/services/node";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
type NodeWithChildren = Node & {
  children: NodeWithChildren[];
};

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

  return roots;
}

function NodeIcon({ node }: { node: Node }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-sm">
      {node.icon || (node.type === NodeType.FOLDER ? "🗂️" : "📄")}
    </span>
  );
}

function NodeTreeItem({
  node,
  canEdit,
  onCreate,
  onRenameNode,
  onDeleteNode,
}: {
  node: NodeWithChildren;
  canEdit: boolean;
  onCreate: (type: NodeType, parentId?: string) => void;
  onRenameNode: (node: NodeWithChildren) => void;
  onDeleteNode: (node: NodeWithChildren) => void;
}) {
  const pathname = usePathname();
  const hasChildren = node.children.length > 0;
  const isActive = pathname === `/home/${node.id}`;

  return (
    <Collapsible
      key={`${node.id}:${node.children.length}`}
      asChild
      defaultOpen={hasChildren}
      className="group/node-collapsible"
    >
      <SidebarMenuItem>
        <div className="flex items-center">
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
                aria-label={`Toggle ${node.title}`}
              >
                <ChevronRightIcon className="size-3.5 transition-transform group-data-[state=open]/node-collapsible:rotate-90" />
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="ml-1 size-6 shrink-0" />
          )}

          <SidebarMenuButton asChild isActive={isActive} className="pl-1">
            <Link href={`/home/${node.id}`}>
              <NodeIcon node={node} />
              <span>{node.title}</span>
            </Link>
          </SidebarMenuButton>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction className="cursor-pointer" showOnHover>
                  <MoreHorizontalIcon />
                  <span className="sr-only">Actions for {node.title}</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full" side="right" align="start">
                {node.type === NodeType.FOLDER && (
                  <>
                    <DropdownMenuItem
                      onSelect={() => onCreate(NodeType.FOLDER, node.id)}
                    >
                      <FolderPlusIcon />
                      Add folder inside
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onCreate(NodeType.PAGE, node.id)}
                    >
                      <FilePlus2Icon />
                      Add page inside
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onSelect={() => onRenameNode(node)}>
                  <PencilIcon />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDeleteNode(node)}
                >
                  <Trash2Icon />
                  Delete {node.type === NodeType.FOLDER ? "folder" : "page"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <SidebarMenuSub className="mr-0 ml-4 pr-0">
              {node.children.map((child) => (
                <NodeTreeItem
                  key={child.id}
                  node={child}
                  canEdit={canEdit}
                  onCreate={onCreate}
                  onRenameNode={onRenameNode}
                  onDeleteNode={onDeleteNode}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
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

  function handleDeleteNode() {
    if (!nodeToDelete) return;

    setDeleteError(null);

    startTransition(async () => {
      const result = await deleteNode({
        workspaceId,
        nodeId: nodeToDelete.id,
      });

      if (result.error) {
        setDeleteError(result.error);
        return;
      }

      setNodeToDelete(null);

      const activeNodeId = pathname.startsWith("/home/")
        ? pathname.slice("/home/".length).split("/")[0]
        : null;

      if (
        activeNodeId &&
        result.archivedNodeIds?.includes(activeNodeId)
      ) {
        router.push("/home");
      }

      router.refresh();
    });
  }

  function handleRenameNode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nodeToRename) return;

    setRenameError(null);

    startTransition(async () => {
      const result = await renameNode({
        workspaceId,
        nodeId: nodeToRename.id,
        title: renameTitle,
      });

      if (result.error) {
        setRenameError(result.error);
        return;
      }

      setNodeToRename(null);
      setRenameTitle("");
      router.refresh();
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
        <SidebarGroupLabel>Halaman</SidebarGroupLabel>
        {canEdit && (
          <>
            <SidebarGroupAction
              type="button"
              disabled={isPending}
              onClick={() => handleCreate(NodeType.FOLDER)}
              className="right-9"
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
            >
              <FilePlus2Icon />
              <span className="sr-only">Add page</span>
            </SidebarGroupAction>
          </>
        )}

        <SidebarMenu>
          {tree.map((node) => (
            <NodeTreeItem
              key={node.id}
              node={node}
              canEdit={canEdit}
              onCreate={handleCreate}
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

      <Dialog
        open={nodeToRename !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setNodeToRename(null);
            setRenameTitle("");
            setRenameError(null);
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleRenameNode}>
            <DialogHeader>
              <DialogTitle>
                Rename{" "}
                {nodeToRename?.type === NodeType.FOLDER ? "folder" : "page"}
              </DialogTitle>
              <DialogDescription>
                Enter a new name for this{" "}
                {nodeToRename?.type === NodeType.FOLDER ? "folder" : "page"}.
              </DialogDescription>
            </DialogHeader>

            <div className="my-6">
              <Input
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                maxLength={100}
                autoFocus
                disabled={isPending}
                aria-invalid={renameError !== null}
              />
              {renameError && (
                <p className="mt-2 text-sm text-destructive">{renameError}</p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isPending || !renameTitle.trim()}
              >
                {isPending ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={nodeToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setNodeToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {nodeToDelete?.type === NodeType.FOLDER ? "folder" : "page"}?
            </DialogTitle>
            <DialogDescription>
              &quot;{nodeToDelete?.title}&quot;
              {nodeToDelete?.children.length
                ? " and all pages inside it"
                : ""}{" "}
              will be moved out of the sidebar.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDeleteNode}
            >
              {isPending
                ? "Deleting..."
                : `Delete ${nodeToDelete?.type === NodeType.FOLDER ? "folder" : "page"
                }`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
