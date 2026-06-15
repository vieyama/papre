import type { Metadata } from "next"
import { GalleryVerticalEndIcon } from "lucide-react"
import Link from "next/link"

import { ResetPasswordForm } from "@/views/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your My Djurnal account.",
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

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          MyDJournal
        </Link>
        <ResetPasswordForm email={email} token={token} />
      </div>
    </div>
  )
}
