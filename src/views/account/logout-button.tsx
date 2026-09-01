"use client";

import { signOut } from "next-auth/react";
import { useParams } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { useDictionary } from "@/i18n/dictionary-context";
import { localeHref } from "@/i18n/paths";

export function LogoutButton() {
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start text-destructive hover:text-destructive sm:w-auto"
      onClick={() => signOut({ redirectTo: localeHref("/", lang) })}
    >
      <LogOutIcon />
      {dict.nav.logout}
    </Button>
  );
}
