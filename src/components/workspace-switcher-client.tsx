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
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    ChevronsUpDownIcon,
    PencilIcon,
    PlusIcon,
    Trash2Icon,
    UsersIcon,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import {
    createWorkspace,
    deleteWorkspace,
    updateWorkspace,
    type CreateWorkspaceResult,
    type DeleteWorkspaceResult,
    type UpdateWorkspaceResult,
} from "@/services/workspace"
import { useWorkspaceStore } from "@/stores/workspace"
import { WorkspaceRole, type Workspace } from "@/generated/prisma/browser"
import { WorkspaceMembersDialog } from "@/components/workspace-members-dialog"
import { useDictionary } from "@/i18n/dictionary-context"
import { localeHref } from "@/i18n/paths"
import { formatMessage } from "@/i18n/format"
import type { Locale } from "@/i18n/config"

export type WorkspaceWithAccess = Workspace & {
    currentUserRole: WorkspaceRole
    memberCount: number
}

function SubmitButton({
    children,
    pendingLabel,
    variant,
}: {
    children: React.ReactNode
    pendingLabel: string
    variant?: React.ComponentProps<typeof Button>["variant"]
}) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} variant={variant}>
            {pending ? pendingLabel : children}
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
    const { lang } = useParams<{ lang: Locale }>()
    const dict = useDictionary()
    const { selectedWorkspace, hasHydrated, setSelectedWorkspace } = useWorkspaceStore()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [isMembersDialogOpen, setIsMembersDialogOpen] = React.useState(false)
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false)
    const [isEditEmojiPickerOpen, setIsEditEmojiPickerOpen] = React.useState(false)
    const [workspaceIcon, setWorkspaceIcon] = React.useState("🏠")
    const [editWorkspaceIcon, setEditWorkspaceIcon] = React.useState("🏠")

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
                router.refresh()
            }
            return result
        },
        {}
    )

    const [editFormState, editFormAction] = React.useActionState<UpdateWorkspaceResult, FormData>(
        async (_, formData) => {
            if (!activeWorkspace) return { error: dict.dialogs.workspace.notFoundError }

            const name = formData.get("name") as string
            const icon = (formData.get("icon") as string) || "🏠"
            const result = await updateWorkspace({
                workspaceId: activeWorkspace.id,
                name,
                icon,
            })

            if (result.success && result.workspace) {
                setSelectedWorkspace({
                    ...activeWorkspace,
                    ...result.workspace,
                })
                setIsEditDialogOpen(false)
                setIsEditEmojiPickerOpen(false)
                router.refresh()
            }

            return result
        },
        {}
    )

    const [deleteFormState, deleteFormAction] = React.useActionState<DeleteWorkspaceResult, FormData>(
        async () => {
            if (!activeWorkspace) return { error: dict.dialogs.workspace.notFoundError }

            const result = await deleteWorkspace({
                workspaceId: activeWorkspace.id,
            })

            if (result.success) {
                setSelectedWorkspace(null)
                setIsDeleteDialogOpen(false)
                router.replace(localeHref("/home", lang))
                router.refresh()
            }

            return result
        },
        {}
    )

    function handleSelectWorkspace(workspace: Workspace) {
        if (workspace.id === activeWorkspace?.id) return

        setSelectedWorkspace(workspace)
        router.replace(localeHref("/home", lang))
    }

    function handleEmojiClick(emojiData: EmojiClickData) {
        setWorkspaceIcon(emojiData.emoji)
        setIsEmojiPickerOpen(false)
    }

    function handleEditEmojiClick(emojiData: EmojiClickData) {
        setEditWorkspaceIcon(emojiData.emoji)
        setIsEditEmojiPickerOpen(false)
    }

    function handleDialogOpenChange(open: boolean) {
        setIsDialogOpen(open)

        if (!open) {
            setIsEmojiPickerOpen(false)
            setWorkspaceIcon("🏠")
        }
    }

    function handleEditDialogOpenChange(open: boolean) {
        setIsEditDialogOpen(open)

        if (open) {
            setEditWorkspaceIcon(activeWorkspace?.icon || "🏠")
            return
        }

        setIsEditEmojiPickerOpen(false)
        setEditWorkspaceIcon(activeWorkspace?.icon || "🏠")
    }

    function handleDeleteDialogOpenChange(open: boolean) {
        setIsDeleteDialogOpen(open)
    }

    const canManageActiveWorkspace =
        activeWorkspace?.currentUserRole === WorkspaceRole.OWNER ||
        activeWorkspace?.currentUserRole === WorkspaceRole.ADMIN
    const canDeleteActiveWorkspace =
        activeWorkspace?.currentUserRole === WorkspaceRole.OWNER

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
                                        {!hasHydrated ? dict.dialogs.workspace.loading : activeWorkspace?.name}</span>
                                    <span className="truncate text-xs">
                                        {activeWorkspace?.memberCount > 1
                                            ? formatMessage(dict.dialogs.workspace.membersCount, { count: activeWorkspace.memberCount })
                                            : dict.dialogs.workspace.personal}
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
                                {dict.dialogs.workspace.workspacesLabel}
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

                            {canManageActiveWorkspace && (
                                <>
                                    <DropdownMenuItem
                                        className="gap-2 p-2"
                                        onSelect={() => handleEditDialogOpenChange(true)}
                                    >
                                        <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                            <PencilIcon className="size-4" />
                                        </div>
                                        <div className="font-medium text-muted-foreground">
                                            {dict.dialogs.workspace.editWorkspace}
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className="gap-2 p-2"
                                        onSelect={() => setIsMembersDialogOpen(true)}
                                    >
                                        <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                            <UsersIcon className="size-4" />
                                        </div>
                                        <div className="font-medium text-muted-foreground">
                                            {dict.dialogs.workspace.manageMembers}
                                        </div>
                                    </DropdownMenuItem>
                                </>
                            )}

                            {canDeleteActiveWorkspace && (
                                <DropdownMenuItem
                                    variant="destructive"
                                    className="gap-2 p-2"
                                    onSelect={() => setIsDeleteDialogOpen(true)}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                        <Trash2Icon className="size-4" />
                                    </div>
                                    <div className="font-medium">
                                        {dict.dialogs.workspace.deleteWorkspace}
                                    </div>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem className="gap-2 p-2" onClick={() => setIsDialogOpen(true)}>
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <PlusIcon className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">{dict.dialogs.workspace.addWorkspace}</div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dict.dialogs.workspace.createTitle}</DialogTitle>
                        <DialogDescription>
                            {dict.dialogs.workspace.createDescription}
                        </DialogDescription>
                    </DialogHeader>

                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{dict.dialogs.workspace.nameLabel}</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder={dict.dialogs.workspace.namePlaceholder}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="workspace-icon-picker">{dict.dialogs.workspace.iconLabel}</Label>
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
                                        aria-label={dict.dialogs.workspace.chooseIconAria}
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
                                <Button variant="outline">{dict.dialogs.workspace.cancel}</Button>
                            </DialogClose>
                            <SubmitButton pendingLabel={dict.dialogs.workspace.creating}>
                                {dict.dialogs.workspace.create}
                            </SubmitButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dict.dialogs.workspace.editTitle}</DialogTitle>
                        <DialogDescription>
                            {dict.dialogs.workspace.editDescription}
                        </DialogDescription>
                    </DialogHeader>

                    <form action={editFormAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-workspace-name">{dict.dialogs.workspace.nameLabel}</Label>
                            <Input
                                id="edit-workspace-name"
                                name="name"
                                defaultValue={activeWorkspace?.name ?? ""}
                                placeholder={dict.dialogs.workspace.namePlaceholder}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-workspace-icon-picker">{dict.dialogs.workspace.iconLabel}</Label>
                            <input
                                name="icon"
                                type="hidden"
                                value={editWorkspaceIcon}
                            />
                            <Popover
                                open={isEditEmojiPickerOpen}
                                onOpenChange={setIsEditEmojiPickerOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        id="edit-workspace-icon-picker"
                                        type="button"
                                        variant="outline"
                                        className="size-12 p-0 text-2xl"
                                        aria-label={dict.dialogs.workspace.chooseIconAria}
                                    >
                                        {editWorkspaceIcon}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    side="right"
                                    className="w-auto border-0 bg-transparent p-0 shadow-none ring-0"
                                >
                                    <EmojiPicker
                                        onEmojiClick={handleEditEmojiClick}
                                        theme={Theme.AUTO}
                                        lazyLoadEmojis
                                        width={350}
                                        height={420}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {editFormState.error && (
                            <p className="text-destructive text-sm">{editFormState.error}</p>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{dict.dialogs.workspace.cancel}</Button>
                            </DialogClose>
                            <SubmitButton pendingLabel={dict.dialogs.workspace.saving}>
                                {dict.dialogs.workspace.saveChanges}
                            </SubmitButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dict.dialogs.workspace.deleteTitle}</DialogTitle>
                        <DialogDescription>
                            {formatMessage(dict.dialogs.workspace.deleteDescription, {
                                name: activeWorkspace?.name ?? "",
                            })}
                        </DialogDescription>
                    </DialogHeader>

                    <form action={deleteFormAction} className="space-y-4">
                        {deleteFormState.error && (
                            <p className="text-destructive text-sm">{deleteFormState.error}</p>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{dict.dialogs.workspace.cancel}</Button>
                            </DialogClose>
                            <SubmitButton pendingLabel={dict.dialogs.workspace.deleting} variant="destructive">
                                {dict.dialogs.workspace.deleteWorkspace}
                            </SubmitButton>
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
