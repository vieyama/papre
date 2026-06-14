'use client'

import { zodResolver } from "@hookform/resolvers/zod"
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
import { requestPasswordReset } from "@/services/auth"
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "./authSchema"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const handleResetRequest = (data: ForgotPasswordFormData) => {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        const result = await requestPasswordReset(data)
        setError(result.error ?? null)
        setMessage(result.message ?? null)
      } catch {
        setError("Gagal mengirim email reset password. Silakan coba lagi.")
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email and we will send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </p>
          )}
          {error && (
            <p className="mb-4 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-600">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit(handleResetRequest)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  required
                />
                {errors.email && (
                  <p className="ml-1 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    {errors.email.message}
                  </p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Sending..." : "Send reset link"}
                </Button>
                <FieldDescription className="text-center">
                  Remember your password? <Link href="/login">Back to login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
