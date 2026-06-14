"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAccountProfile } from "@/services/account";

export function AccountProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateAccountProfile({ name });

      if (result.error) {
        setError(result.error);
        return;
      }

      const updatedName = result.name ?? name.trim();
      setName(updatedName);
      setSavedName(updatedName);
      setMessage("Profil berhasil diperbarui.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="account-name">Full name</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          minLength={2}
          maxLength={128}
          required
        />
        <p className="text-xs text-muted-foreground">
          This name is shown in your workspace and account menu.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" value={email} readOnly disabled />
        <p className="text-xs text-muted-foreground">
          Your email is managed by your sign-in method and cannot be changed here.
        </p>
      </div>

      {error && (
        <p
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          role="status"
        >
          {message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || name.trim() === savedName}
      >
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
