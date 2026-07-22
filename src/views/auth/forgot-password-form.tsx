'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
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
  createForgotPasswordSchema,
  type ForgotPasswordFormData,
} from "./authSchema"
import { useDictionary } from "@/i18n/dictionary-context"
import { localeHref } from "@/i18n/paths"
import type { Locale } from "@/i18n/config"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { lang } = useParams<{ lang: Locale }>()
  const dict = useDictionary()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(dict.auth.validation)),
    defaultValues: { email: "" },
  })

  const handleResetRequest = (data: ForgotPasswordFormData) => {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        const result = await requestPasswordReset(data, lang)
        setError(result.error ?? null)
        setMessage(result.message ?? null)
      } catch {
        setError(dict.auth.forgotPassword.genericError)
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.auth.forgotPassword.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.auth.forgotPassword.subtitle}
        </p>
      </div>

      {message && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit(handleResetRequest)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">{dict.auth.forgotPassword.emailLabel}</FieldLabel>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="m@example.com"
              autoComplete="email"
              required
            />
            {errors.email && (
              <p className="ml-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>
              {isPending ? dict.auth.forgotPassword.submitPending : dict.auth.forgotPassword.submit}
            </Button>
            <FieldDescription className="text-center">
              {dict.auth.forgotPassword.rememberPassword} <Link href={localeHref("/login", lang)}>{dict.auth.forgotPassword.backToLogin}</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
