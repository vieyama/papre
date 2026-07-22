"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2Icon, Trash2Icon, UserPlusIcon } from "lucide-react";

import { WorkspaceRole } from "@/generated/prisma/browser";
import {
  addWorkspaceMember,
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/services/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "./ui/native-select";
import { useDictionary } from "@/i18n/dictionary-context";
import { formatMessage } from "@/i18n/format";

type AddMemberForm = {
  email: string;
  role: WorkspaceRole;
};

function assignableRoles(role: WorkspaceRole) {
  return role === WorkspaceRole.OWNER
    ? [WorkspaceRole.ADMIN, WorkspaceRole.MEMBER, WorkspaceRole.VIEWER]
    : [WorkspaceRole.MEMBER, WorkspaceRole.VIEWER];
}

function canManageMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
) {
  if (actorRole === WorkspaceRole.OWNER) {
    return targetRole !== WorkspaceRole.OWNER;
  }

  return (
    actorRole === WorkspaceRole.ADMIN &&
    (targetRole === WorkspaceRole.MEMBER ||
      targetRole === WorkspaceRole.VIEWER)
  );
}

export function WorkspaceMembersDialog({
  workspaceId,
  workspaceName,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  workspaceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const dict = useDictionary();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = React.useState<string | null>(null);
  const form = useForm<AddMemberForm>({
    defaultValues: {
      email: "",
      role: WorkspaceRole.MEMBER,
    },
  });
  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const result = await getWorkspaceMembers(workspaceId);

      if (result.error || !result.members || !result.currentUserRole) {
        throw new Error(result.error ?? dict.dialogs.members.loadError);
      }

      return {
        members: result.members,
        currentUserRole: result.currentUserRole,
        canManageMembers: result.canManageMembers ?? false,
      };
    },
    enabled: open,
  });
  const addMutation = useMutation({
    mutationFn: async (values: AddMemberForm) => {
      const result = await addWorkspaceMember({
        workspaceId,
        email: values.email,
        role: values.role,
      });

      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      form.reset();
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      router.refresh();
    },
    onError: (error) => setActionError(error.message),
  });
  const roleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: WorkspaceRole;
    }) => {
      const result = await updateWorkspaceMemberRole({
        workspaceId,
        memberId,
        role,
      });

      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      router.refresh();
    },
    onError: (error) => setActionError(error.message),
  });
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await removeWorkspaceMember({
        workspaceId,
        memberId,
      });

      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      router.refresh();
    },
    onError: (error) => setActionError(error.message),
  });

  const actorRole = membersQuery.data?.currentUserRole;
  const roles = actorRole ? assignableRoles(actorRole) : [];
  const isMutating =
    addMutation.isPending ||
    roleMutation.isPending ||
    removeMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setActionError(null);
          form.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{formatMessage(dict.dialogs.members.title, { workspaceName })}</DialogTitle>
          <DialogDescription>
            {dict.dialogs.members.description}
          </DialogDescription>
        </DialogHeader>

        {membersQuery.isLoading && (
          <div className="flex min-h-36 items-center justify-center">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {membersQuery.error && (
          <p className="text-sm text-destructive">
            {membersQuery.error.message}
          </p>
        )}

        {membersQuery.data && (
          <>
            {membersQuery.data.canManageMembers && (
              <form
                className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[1fr_120px_auto]"
                onSubmit={form.handleSubmit((values) => {
                  setActionError(null);
                  addMutation.mutate(values);
                })}
              >
                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="workspace-member-email">
                    {dict.dialogs.members.addExisting}
                  </Label>
                </div>
                <Input
                  id="workspace-member-email"
                  type="email"
                  placeholder={dict.dialogs.members.emailPlaceholder}
                  disabled={isMutating}
                  {...form.register("email", {
                    required: dict.dialogs.members.emailRequired,
                  })}
                />
                <NativeSelect
                  aria-label="Workspace role"
                  disabled={isMutating}
                  className="w-full"
                  {...form.register("role")}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </NativeSelect>
                <Button type="submit" disabled={isMutating}>
                  <UserPlusIcon />
                  {dict.dialogs.members.add}
                </Button>
                {form.formState.errors.email?.message && (
                  <p className="text-sm text-destructive sm:col-span-3">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </form>
            )}

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {membersQuery.data.members.map((member) => {
                const manageable =
                  actorRole && canManageMember(actorRole, member.role);

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-medium">
                      {(member.user.name || member.user.email)
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.user.name || dict.dialogs.members.noName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>

                    {manageable ? (
                      <>
                        <NativeSelect
                          aria-label={formatMessage(dict.dialogs.members.roleAria, { email: member.user.email })}
                          value={member.role}
                          disabled={isMutating}
                          className="w-full"
                          onChange={(event) => {
                            setActionError(null);
                            roleMutation.mutate({
                              memberId: member.id,
                              role: event.target.value as WorkspaceRole,
                            });
                          }}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </NativeSelect>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          disabled={isMutating}
                          aria-label={formatMessage(dict.dialogs.members.removeAria, { email: member.user.email })}
                          onClick={() => {
                            setActionError(null);
                            removeMutation.mutate(member.id);
                          }}
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {member.role}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {actionError && (
              <p className="text-sm text-destructive">{actionError}</p>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {dict.dialogs.members.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
