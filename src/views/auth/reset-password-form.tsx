'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { resetPassword } from "@/services/auth"
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "./authSchema"

export function ResetPasswordForm({
  email,
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  email: string
  token: string
}) {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      token,
      password: "",
      confirmPassword: "",
    },
  })

  const handlePasswordReset = (data: ResetPasswordFormData) => {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        const result = await resetPassword(data)
        setError(result.error ?? null)
        setMessage(result.message ?? null)
      } catch {
        setError("Gagal memperbarui password. Silakan coba lagi.")
      }
    })
  }

  const tokenIsMissing = !email || !token

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create a new password</CardTitle>
          <CardDescription>
            Your new password must contain at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </p>
          )}
          {(error || tokenIsMissing) && (
            <p className="mb-4 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-600">
              {error ?? "Tautan reset password tidak valid. Silakan minta tautan baru."}
            </p>
          )}
          {!message && !tokenIsMissing && (
            <form onSubmit={handleSubmit(handlePasswordReset)}>
              <input type="hidden" {...register("email")} />
              <input type="hidden" {...register("token")} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">New password</FieldLabel>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-4 top-1.5 p-0.5 text-slate-400"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="ml-1 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                      {errors.password.message}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                  <Input
                    {...register("confirmPassword")}
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="ml-1 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update password"}
                </Button>
              </FieldGroup>
            </form>
          )}
          <FieldDescription className="mt-4 text-center">
            {message ? (
              <Link href="/login">Continue to login</Link>
            ) : (
              <Link href="/forgot-password">Request a new reset link</Link>
            )}
          </FieldDescription>
        </CardContent>
      </Card>
    </div>
  )
}
