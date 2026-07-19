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
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { RegisterFormData, registerSchema } from "./authSchema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerWithEmail } from "@/services/auth"
import { Eye, EyeOff } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const handleAuth = async (data: RegisterFormData) => {
    setError(null)

    startTransition(async () => {
      try {
        const result = await registerWithEmail(data)

        if (result?.error) {
          setError(result.error)
          return
        }

        if (result?.success) {
          router.replace('/home')
          router.refresh()
        }
      } catch {
        setError('Autentikasi gagal. Silakan coba lagi.')
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email below to create your account
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
            <FieldLabel htmlFor="name">Full Name</FieldLabel>
            <Input id="name" type="text" placeholder="John Doe" {...register('name')} />
            {errors.name && (
              <p className="ml-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="ml-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="ml-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>{isPending ? 'Signing up' : 'Create Account'}</Button>
            <FieldDescription className="text-center">
              Already have an account? <Link href="/login">Sign in</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="text-center">
        By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link>{" "}
        and <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  )
}
