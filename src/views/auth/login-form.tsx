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
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { authenticateWithEmail, signInWithGoogle } from "@/services/auth"
import { AuthFormData, authSchema } from "./authSchema"
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"

export function LoginForm({
  className,
  redirectTo = "/home",
  ...props
}: React.ComponentProps<"div"> & {
  redirectTo?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleAuth = async (data: AuthFormData) => {
    setError(null)

    startTransition(async () => {
      try {
        const result = await authenticateWithEmail(data)

        if (result?.error) {
          setError(result.error)
          return
        }

        if (result?.success) {
          router.replace(redirectTo)
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
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Login with your Google account
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form action={signInWithGoogle}>
        <FieldGroup className="mb-4">
          <Field>
            <Button variant="outline" type="submit">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
          </Field>
          <FieldSeparator>Or continue with</FieldSeparator>
        </FieldGroup>
      </form>
      <form onSubmit={handleSubmit(handleAuth)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="ml-1 text-xs text-destructive">{errors.password.message}</p>
            )}
            <div className="flex items-center">
              <Link
                href="/forgot-password"
                className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>{isPending ? 'Logging in...' : 'Login'}</Button>
            <FieldDescription className="text-center">
              Don&apos;t have an account? <Link href="/signup">Sign up</Link>
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
