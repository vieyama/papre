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
        Share
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
            <DialogTitle>Share page</DialogTitle>
            <DialogDescription>
              Bagikan page hanya kepada user tertentu atau siapa pun yang
              memiliki link.
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
              <h3 className="mt-3 font-medium">Page belum dibagikan</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Buat link private terlebih dahulu. Kamu dapat mengubahnya
                menjadi public kapan saja.
              </p>
              <Button
                className="mt-5"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Membuat..." : "Buat share link"}
              </Button>
            </div>
          )}

          {share && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="page-share-visibility">Who has access</Label>
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
                    Only people invited
                  </option>
                  <option value={PageShareVisibility.PUBLIC}>
                    Anyone on the web with the link
                  </option>
                </NativeSelect>
              </div>

              <div className="flex gap-2">
                <Input
                  readOnly
                  value={share.path}
                  aria-label="Share link"
                />
                <Button type="button" variant="outline" onClick={copyLink}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied" : "Copy"}
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
                      placeholder="Invite by email"
                      disabled={isMutating}
                      {...form.register("email", {
                        required: "Email wajib diisi.",
                      })}
                    />
                    <Button type="submit" disabled={isMutating}>
                      <UserPlusIcon />
                      Invite
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
                            {invite.user.name || "Tanpa nama"}
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
                          aria-label={`Remove ${invite.user.email}`}
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {share.invitedUsers.length === 0 && (
                      <div className="rounded-lg border border-dashed px-4 py-5 text-center">
                        <p className="text-sm font-medium">
                          Link ini belum dapat dibuka orang lain
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Undang user melalui email, atau ubah akses menjadi
                          Anyone on the web with the link.
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
                Stop sharing
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
