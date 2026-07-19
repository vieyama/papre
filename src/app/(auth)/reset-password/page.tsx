import type { Metadata } from "next"

import { ResetPasswordForm } from "@/views/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Papre account.",
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
