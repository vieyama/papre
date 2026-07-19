import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/views/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Papre account.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
