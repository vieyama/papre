import type { Metadata } from "next"
import { LoginForm } from "@/views/auth/login-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Papre workspace and continue writing.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth()
  if (session?.user?.id) redirect("/")
    
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/home";
  
  return <LoginForm redirectTo={safeCallbackUrl} />
}
