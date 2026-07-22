import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/views/auth/forgot-password-form"
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
    title: dict.auth.forgotPassword.metaTitle,
    description: dict.auth.forgotPassword.metaDescription,
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
