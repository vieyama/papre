import type { Metadata } from "next"

import { ResetPasswordForm } from "@/views/auth/reset-password-form"
import { getDictionary, hasLocale } from "@/i18n/dictionaries"
import { defaultLocale } from "@/i18n/config"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    title: dict.auth.resetPassword.metaTitle,
    description: dict.auth.resetPassword.metaDescription,
  };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[]
    token?: string | string[]
  }>
}) {
  const params = await searchParams
  const email = typeof params.email === "string" ? params.email : ""
  const token = typeof params.token === "string" ? params.token : ""

  return <ResetPasswordForm email={email} token={token} />
}
