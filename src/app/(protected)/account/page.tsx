import type { Metadata } from "next";
import { KeyRoundIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { AccountProfileForm } from "@/views/account/account-profile-form";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile and sign-in information in My Djurnal.",
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      passwordHash: true,
      createdAt: true,
      accounts: {
        select: { provider: true },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const providers = [
    ...(user.passwordHash ? ["Email & password"] : []),
    ...user.accounts.map((account) =>
      account.provider === "google" ? "Google" : account.provider,
    ),
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and sign-in information.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src={user.image ?? ""} alt={user.name ?? user.email} />
              <AvatarFallback className="text-base">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate">
                {user.name || "Unnamed account"}
              </CardTitle>
              <CardDescription className="truncate">
                {user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AccountProfileForm
            initialName={user.name ?? ""}
            email={user.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Sign-in methods connected to this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <KeyRoundIcon className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {providers.length > 0 ? providers.join(", ") : "External provider"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Member since{" "}
                {new Intl.DateTimeFormat("en", {
                  month: "long",
                  year: "numeric",
                }).format(user.createdAt)}
              </p>
            </div>
          </div>

          {user.passwordHash && (
            <Button variant="outline" asChild>
              <Link href="/forgot-password">Reset password</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
