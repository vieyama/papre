"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  CheckIcon,
  CopyIcon,
  LinkIcon,
  Loader2Icon,
  Share2Icon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";

import { PageShareVisibility } from "@/generated/prisma/browser";
import {
  createPageShare,
  disablePageShare,
  getPageShareSettings,
  inviteUserToPage,
  removePageInvite,
  updatePageShareVisibility,
} from "@/services/page-share";
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

type InviteForm = {
  email: string;
};

export function PageShareDialog({
  nodeId,
  workspaceId,
}: {
  nodeId: string;
  workspaceId: string;
}) {
  const dict = useDictionary();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const form = useForm<InviteForm>({
    defaultValues: {
      email: "",
    },
  });
  const queryKey = ["page-share", nodeId];
  const shareQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getPageShareSettings({ nodeId, workspaceId });

      if (result.error) throw new Error(result.error);

      return result.share ?? null;
    },
    enabled: open,
  });

  async function refreshShare() {
    await queryClient.invalidateQueries({ queryKey });
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await createPageShare({ nodeId, workspaceId });
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setActionError(null);
      await refreshShare();
    },
    onError: (error) => setActionError(error.message),
  });
  const visibilityMutation = useMutation({
    mutationFn: async (visibility: PageShareVisibility) => {
      const result = await updatePageShareVisibility({
        nodeId,
        workspaceId,
        visibility,
      });
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setActionError(null);
      await refreshShare();
    },
    onError: (error) => setActionError(error.message),
  });
  const inviteMutation = useMutation({
    mutationFn: async ({ email }: InviteForm) => {
      const result = await inviteUserToPage({
        nodeId,
        workspaceId,
        email,
      });
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      form.reset();
      setActionError(null);
      await refreshShare();
    },
    onError: (error) => setActionError(error.message),
  });
  const removeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const result = await removePageInvite({
        nodeId,
        workspaceId,
        inviteId,
      });
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setActionError(null);
      await refreshShare();
    },
    onError: (error) => setActionError(error.message),
  });
  const disableMutation = useMutation({
    mutationFn: async () => {
      const result = await disablePageShare({ nodeId, workspaceId });
      if (result.error) throw new Error(result.error);
    },
    onSuccess: async () => {
      setCopied(false);
      setActionError(null);
      await refreshShare();
    },
    onError: (error) => setActionError(error.message),
  });
  const isMutating =
    createMutation.isPending ||
    visibilityMutation.isPending ||
    inviteMutation.isPending ||
    removeInviteMutation.isPending ||
    disableMutation.isPending;
  const share = shareQuery.data;

  async function copyLink() {
    if (!share?.path) return;

    await navigator.clipboard.writeText(
      new URL(share.path, window.location.origin).toString(),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2Icon />
        {dict.dialogs.share.shareButton}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setActionError(null);
            setCopied(false);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dict.dialogs.share.title}</DialogTitle>
            <DialogDescription>
              {dict.dialogs.share.description}
            </DialogDescription>
          </DialogHeader>

          {shareQuery.isLoading && (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {shareQuery.error && (
            <p className="text-sm text-destructive">
              {shareQuery.error.message}
            </p>
          )}

          {!shareQuery.isLoading && !shareQuery.error && !share && (
            <div className="rounded-xl border border-dashed px-5 py-8 text-center">
              <LinkIcon className="mx-auto size-8 text-muted-foreground" />
              <h3 className="mt-3 font-medium">{dict.dialogs.share.pageNotShared}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {dict.dialogs.share.createFirst}
              </p>
              <Button
                className="mt-5"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? dict.dialogs.share.creating : dict.dialogs.share.createLink}
              </Button>
            </div>
          )}

          {share && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="page-share-visibility">{dict.dialogs.share.whoHasAccess}</Label>
                <NativeSelect
                  id="page-share-visibility"
                  value={share.visibility}
                  disabled={isMutating}
                  className="w-full"
                  onChange={(event) =>
                    visibilityMutation.mutate(
                      event.target.value as PageShareVisibility,
                    )
                  }
                >
                  <option value={PageShareVisibility.INVITED}>
                    {dict.dialogs.share.onlyInvited}
                  </option>
                  <option value={PageShareVisibility.PUBLIC}>
                    {dict.dialogs.share.anyoneWithLink}
                  </option>
                </NativeSelect>
              </div>

              <div className="flex gap-2">
                <Input
                  readOnly
                  value={share.path}
                  aria-label={dict.dialogs.share.shareLinkAria}
                />
                <Button type="button" variant="outline" onClick={copyLink}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? dict.dialogs.share.copied : dict.dialogs.share.copy}
                </Button>
              </div>

              {share.visibility === PageShareVisibility.INVITED && (
                <>
                  <form
                    className="flex gap-2"
                    onSubmit={form.handleSubmit((values) => {
                      setActionError(null);
                      inviteMutation.mutate(values);
                    })}
                  >
                    <Input
                      type="email"
                      placeholder={dict.dialogs.share.inviteByEmail}
                      disabled={isMutating}
                      {...form.register("email", {
                        required: dict.dialogs.share.emailRequired,
                      })}
                    />
                    <Button type="submit" disabled={isMutating}>
                      <UserPlusIcon />
                      {dict.dialogs.share.invite}
                    </Button>
                  </form>

                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {share.invitedUsers.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {(invite.user.name || invite.user.email)
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {invite.user.name || dict.dialogs.share.noName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {invite.user.email}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          disabled={isMutating}
                          onClick={() =>
                            removeInviteMutation.mutate(invite.id)
                          }
                          aria-label={formatMessage(dict.dialogs.share.removeInviteAria, { email: invite.user.email })}
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {share.invitedUsers.length === 0 && (
                      <div className="rounded-lg border border-dashed px-4 py-5 text-center">
                        <p className="text-sm font-medium">
                          {dict.dialogs.share.noInvitesTitle}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {dict.dialogs.share.noInvitesDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
            </div>
          )}

          <DialogFooter className="justify-between sm:justify-between">
            {share ? (
              <Button
                type="button"
                variant="destructive"
                disabled={isMutating}
                onClick={() => disableMutation.mutate()}
              >
                {dict.dialogs.share.stopSharing}
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {dict.dialogs.share.done}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
