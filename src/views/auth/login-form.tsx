'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { authenticateWithEmail, signInWithGoogle } from "@/services/auth"
import { createAuthSchema, type AuthFormData } from "./authSchema"
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"
import { useDictionary } from "@/i18n/dictionary-context"
import { localeHref } from "@/i18n/paths"
import type { Locale } from "@/i18n/config"

export function LoginForm({
  className,
  redirectTo = "/home",
  ...props
}: React.ComponentProps<"div"> & {
  redirectTo?: string
}) {
  const router = useRouter()
  const { lang } = useParams<{ lang: Locale }>()
  const dict = useDictionary()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(createAuthSchema(dict.auth.validation)),
    defaultValues: { email: '', password: '' },
  })

  const handleAuth = async (data: AuthFormData) => {
    setError(null)

    startTransition(async () => {
      try {
        const result = await authenticateWithEmail(data, lang)

        if (result?.error) {
          setError(result.error)
          return
        }

        if (result?.success) {
          router.replace(redirectTo)
          router.refresh()
        }
      } catch {
        setError(dict.auth.login.genericError)
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.auth.login.welcomeBack}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.auth.login.googleSubtitle}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form action={() => signInWithGoogle(lang)}>
        <FieldGroup className="mb-4">
          <Field>
            <Button variant="outline" type="submit">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              {dict.auth.login.googleButton}
            </Button>
          </Field>
          <FieldSeparator>{dict.auth.login.orContinueWith}</FieldSeparator>
        </FieldGroup>
      </form>
      <form onSubmit={handleSubmit(handleAuth)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">{dict.auth.login.emailLabel}</FieldLabel>
            <Input
              {...register('email')}
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              className="w-full"
            />
            {errors.email && (
              <p className="ml-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">{dict.auth.login.passwordLabel}</FieldLabel>
            <div className="relative">
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="ml-1 text-xs text-destructive">{errors.password.message}</p>
            )}
            <div className="flex items-center">
              <Link
                href={localeHref("/forgot-password", lang)}
                className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {dict.auth.login.forgotPassword}
              </Link>
            </div>
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>
              {isPending ? dict.auth.login.submitPending : dict.auth.login.submit}
            </Button>
            <FieldDescription className="text-center">
              {dict.auth.login.noAccount} <Link href={localeHref("/signup", lang)}>{dict.auth.login.signUp}</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="text-center">
        {dict.auth.termsAgreementPrefix} <Link href={localeHref("/terms", lang)}>{dict.auth.termsLink}</Link>{" "}
        {dict.auth.termsAgreementJoin} <Link href={localeHref("/privacy", lang)}>{dict.auth.privacyLink}</Link>.
      </FieldDescription>
    </div>
  )
}
