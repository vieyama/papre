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
import { getDictionary, hasLocale } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/paths";
import { defaultLocale, type Locale } from "@/i18n/config";
import { formatMessage } from "@/i18n/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    title: dict.account.metaTitle,
    description: dict.account.metaDescription,
  };
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function intlLocale(locale: Locale) {
  return locale === "id" ? "id-ID" : "en-US";
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const session = await auth();

  if (!session?.user?.id) {
    redirect(localeHref("/login", locale));
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
    redirect(localeHref("/login", locale));
  }

  const providers = [
    ...(user.passwordHash ? [dict.account.providerEmailPassword] : []),
    ...user.accounts.map((account) =>
      account.provider === "google" ? dict.account.providerGoogle : account.provider,
    ),
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.account.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.account.description}
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
                {user.name || dict.account.unnamedAccount}
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
          <CardTitle>{dict.account.security}</CardTitle>
          <CardDescription>
            {dict.account.securityDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <KeyRoundIcon className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {providers.length > 0 ? providers.join(", ") : dict.account.externalProvider}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatMessage(dict.account.memberSince, {
                  date: new Intl.DateTimeFormat(intlLocale(locale), {
                    month: "long",
                    year: "numeric",
                  }).format(user.createdAt),
                })}
              </p>
            </div>
          </div>

          {user.passwordHash && (
            <Button variant="outline" asChild>
              <Link href={localeHref("/forgot-password", locale)}>{dict.account.resetPassword}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
