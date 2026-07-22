'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { createRegisterSchema, type RegisterFormData } from "./authSchema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerWithEmail } from "@/services/auth"
import { Eye, EyeOff } from "lucide-react"
import { useDictionary } from "@/i18n/dictionary-context"
import { localeHref } from "@/i18n/paths"
import type { Locale } from "@/i18n/config"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
  } = useForm<RegisterFormData>({
    resolver: zodResolver(createRegisterSchema(dict.auth.validation)),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const handleAuth = async (data: RegisterFormData) => {
    setError(null)

    startTransition(async () => {
      try {
        const result = await registerWithEmail(data, lang)

        if (result?.error) {
          setError(result.error)
          return
        }

        if (result?.success) {
          router.replace(localeHref('/home', lang))
          router.refresh()
        }
      } catch {
        setError(dict.auth.signup.genericError)
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.auth.signup.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.auth.signup.subtitle}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit(handleAuth)}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="name">{dict.auth.signup.fullNameLabel}</FieldLabel>
            <Input id="name" type="text" placeholder="John Doe" {...register('name')} />
            {errors.name && (
              <p className="ml-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">{dict.auth.signup.emailLabel}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="ml-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">{dict.auth.signup.passwordLabel}</FieldLabel>
            <div className="relative">
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">{dict.auth.signup.confirmPasswordLabel}</FieldLabel>
            <div className="relative">
              <Input
                {...register('confirmPassword')}
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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
            {errors.confirmPassword && (
              <p className="ml-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>{isPending ? dict.auth.signup.submitPending : dict.auth.signup.submit}</Button>
            <FieldDescription className="text-center">
              {dict.auth.signup.haveAccount} <Link href={localeHref("/login", lang)}>{dict.auth.signup.signIn}</Link>
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
