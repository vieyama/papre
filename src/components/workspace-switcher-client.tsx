"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import EmojiPicker, {
    Theme,
    type EmojiClickData,
} from "emoji-picker-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronsUpDownIcon, PlusIcon, UsersIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { createWorkspace, type CreateWorkspaceResult } from "@/services/workspace"
import { useWorkspaceStore } from "@/stores/workspace"
import { WorkspaceRole, type Workspace } from "@/generated/prisma/browser"
import { WorkspaceMembersDialog } from "@/components/workspace-members-dialog"

export type WorkspaceWithAccess = Workspace & {
    currentUserRole: WorkspaceRole
    memberCount: number
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create workspace"}
        </Button>
    )
}

export function WorkspaceSwitcherClient({
    workspaces,
    initialWorkspace,
}: {
    workspaces: WorkspaceWithAccess[]
    initialWorkspace: WorkspaceWithAccess
}) {
    const { isMobile } = useSidebar()
    const router = useRouter()
    const { selectedWorkspace, hasHydrated, setSelectedWorkspace } = useWorkspaceStore()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isMembersDialogOpen, setIsMembersDialogOpen] = React.useState(false)
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false)
    const [workspaceIcon, setWorkspaceIcon] = React.useState("🏠")

    const activeWorkspace =
        workspaces.find((workspace) => workspace.id === selectedWorkspace?.id) ??
        initialWorkspace

    const [formState, formAction] = React.useActionState<CreateWorkspaceResult, FormData>(
        async (_, formData) => {
            const name = formData.get("name") as string
            const icon = (formData.get("icon") as string) || "🏠"
            const result = await createWorkspace(name, icon)
            if (result.success) {
                setIsDialogOpen(false)
                setIsEmojiPickerOpen(false)
                setWorkspaceIcon("🏠")
            }
            return result
        },
        {}
    )

    function handleSelectWorkspace(workspace: Workspace) {
        if (workspace.id === activeWorkspace?.id) return

        setSelectedWorkspace(workspace)
        router.replace("/home")
    }

    function handleEmojiClick(emojiData: EmojiClickData) {
        setWorkspaceIcon(emojiData.emoji)
        setIsEmojiPickerOpen(false)
    }

    function handleDialogOpenChange(open: boolean) {
        setIsDialogOpen(open)

        if (!open) {
            setIsEmojiPickerOpen(false)
            setWorkspaceIcon("🏠")
        }
    }

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <span>{activeWorkspace?.icon || "🏠"}</span>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {!hasHydrated ? "Loading..." : activeWorkspace?.name}</span>
                                    <span className="truncate text-xs">
                                        {activeWorkspace?.memberCount > 1
                                            ? `${activeWorkspace?.memberCount} members`
                                            : "Personal"}
                                    </span>
                                </div>
                                <ChevronsUpDownIcon className="ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            className="w-fit"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Workspaces
                            </DropdownMenuLabel>

                            {workspaces.map((workspace, index) => (
                                <DropdownMenuItem
                                    key={workspace.id}
                                    onClick={() => handleSelectWorkspace(workspace)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border">
                                        <span>{workspace.icon || "🏠"}</span>
                                    </div>
                                    {workspace.name}
                                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            ))}

                            <DropdownMenuSeparator />

                            {(activeWorkspace?.currentUserRole === WorkspaceRole.OWNER ||
                                activeWorkspace?.currentUserRole === WorkspaceRole.ADMIN) && (
                                <DropdownMenuItem
                                    className="gap-2 p-2"
                                    onSelect={() => setIsMembersDialogOpen(true)}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                        <UsersIcon className="size-4" />
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        Manage members
                                    </div>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem className="gap-2 p-2" onClick={() => setIsDialogOpen(true)}>
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <PlusIcon className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">Add workspace</div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create new workspace</DialogTitle>
                        <DialogDescription>
                            Add a new workspace to organize your work.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Workspace name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="My workspace"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="workspace-icon-picker">Icon (optional)</Label>
                            <input
                                name="icon"
                                type="hidden"
                                value={workspaceIcon}
                            />
                            <Popover
                                open={isEmojiPickerOpen}
                                onOpenChange={setIsEmojiPickerOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        id="workspace-icon-picker"
                                        type="button"
                                        variant="outline"
                                        className="size-12 p-0 text-2xl"
                                        aria-label="Choose workspace icon"
                                    >
                                        {workspaceIcon}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    side="right"
                                    className="w-auto border-0 bg-transparent p-0 shadow-none ring-0"
                                >
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        theme={Theme.AUTO}
                                        lazyLoadEmojis
                                        width={350}
                                        height={420}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {formState.error && (
                            <p className="text-destructive text-sm">{formState.error}</p>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <SubmitButton />
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <WorkspaceMembersDialog
                workspaceId={activeWorkspace?.id}
                workspaceName={activeWorkspace?.name}
                open={isMembersDialogOpen}
                onOpenChange={setIsMembersDialogOpen}
            />
        </>
    )
}
