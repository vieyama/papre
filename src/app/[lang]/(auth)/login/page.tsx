import type { Metadata } from "next"
import { LoginForm } from "@/views/auth/login-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDictionary, hasLocale } from "@/i18n/dictionaries"
import { localeHref } from "@/i18n/paths"
import { defaultLocale, type Locale } from "@/i18n/config"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    title: dict.auth.login.metaTitle,
    description: dict.auth.login.metaDescription,
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const session = await auth()
  if (session?.user?.id) redirect(localeHref("/", locale))

  const { callbackUrl } = await searchParams;
  const safeCallbackUrl =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : localeHref("/home", locale);

  return <LoginForm redirectTo={safeCallbackUrl} />
}
