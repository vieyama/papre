import * as React from "react";
import { NodeType } from "@/generated/prisma/enums";
import { NodeWithChildren } from "./type";
import { usePathname } from "next/navigation";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, useSidebar } from "../ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { ChevronRightIcon, FilePlus2Icon, MoreHorizontalIcon, FolderPlusIcon, ArrowLeftRightIcon, ArrowUpIcon, ArrowDownIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { NodeIcon } from "./node-icon";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NodeTreeItem({
    node,
    canEdit,
    canMoveUp,
    canMoveDown,
    onCreate,
    onMoveNode,
    onReorderNode,
    onRenameNode,
    onDeleteNode,
}: {
    node: NodeWithChildren;
    canEdit: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onCreate: (type: NodeType, parentId?: string) => void;
    onMoveNode: (node: NodeWithChildren) => void;
    onReorderNode: (node: NodeWithChildren, direction: "up" | "down") => void;
    onRenameNode: (node: NodeWithChildren) => void;
    onDeleteNode: (node: NodeWithChildren) => void;
}) {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();
    const hasChildren = node.children.length > 0;
    const isActive = pathname === `/home/${node.id}`;
    const [isOpen, setIsOpen] = React.useState(hasChildren);

    function handleNavigate() {
        if (isMobile) {
            setOpenMobile(false);
        }
    }

    return (
        <Collapsible
            asChild
            open={isOpen}
            onOpenChange={setIsOpen}
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
                                <ChevronRightIcon
                                    className={cn(
                                        "size-3.5 transition-transform",
                                        isOpen && "rotate-90",
                                    )}
                                />
                            </button>
                        </CollapsibleTrigger>
                    ) : (
                        <span className="ml-1 size-6 shrink-0" />
                    )}

                    <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={
                            canEdit
                                ? node.type === NodeType.FOLDER
                                    ? "pl-1 pr-20"
                                    : "pl-1 pr-8"
                                : "pl-1"
                        }
                    >
                        <Link href={`/home/${node.id}`} onNavigate={handleNavigate}>
                            <NodeIcon node={node} />
                            <span>{node.title}</span>
                        </Link>
                    </SidebarMenuButton>

                    {canEdit && node.type === NodeType.FOLDER && (
                        <SidebarMenuAction
                            type="button"
                            className="cursor-pointer bg-white right-8 aria-expanded:bg-muted"
                            showOnHover
                            onClick={() => onCreate(NodeType.PAGE, node.id)}
                            aria-label={`Add page inside ${node.title}`}
                            title="Add page inside"
                        >
                            <FilePlus2Icon />
                            <span className="sr-only">Add page inside {node.title}</span>
                        </SidebarMenuAction>
                    )}

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
                                    </>
                                )}
                                <DropdownMenuItem onSelect={() => onMoveNode(node)}>
                                    <ArrowLeftRightIcon />
                                    Move
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={!canMoveUp}
                                    onSelect={() => onReorderNode(node, "up")}
                                >
                                    <ArrowUpIcon />
                                    Move up
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={!canMoveDown}
                                    onSelect={() => onReorderNode(node, "down")}
                                >
                                    <ArrowDownIcon />
                                    Move down
                                </DropdownMenuItem>
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
                            {node.children.map((child, index) => (
                                <NodeTreeItem
                                    key={child.id}
                                    node={child}
                                    canEdit={canEdit}
                                    canMoveUp={index > 0}
                                    canMoveDown={index < node.children.length - 1}
                                    onCreate={onCreate}
                                    onMoveNode={onMoveNode}
                                    onReorderNode={onReorderNode}
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