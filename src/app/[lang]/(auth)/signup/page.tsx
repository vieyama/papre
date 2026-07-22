import type { Metadata } from "next"
import { SignupForm } from "@/views/auth/signup-form"
import { auth } from "@/auth";
import { redirect } from "next/navigation";
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
    title: dict.auth.signup.metaTitle,
    description: dict.auth.signup.metaDescription,
  };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const session = await auth()
  if (session?.user?.id) redirect(localeHref("/", locale))

  return <SignupForm />
}
