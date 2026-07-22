import { z } from 'zod'

import type { Dictionary } from '@/i18n/dictionary.types'

type ValidationMessages = Dictionary["auth"]["validation"]

export function createAuthSchema(messages: ValidationMessages) {
  return z.object({
    email: z.email(messages.emailInvalid).trim().toLowerCase(),
    password: z.string().min(8, messages.passwordMin).max(128, messages.passwordMax),
  })
}

export function createRegisterSchema(messages: ValidationMessages) {
  return createAuthSchema(messages)
    .extend({
      name: z.string().min(2, messages.nameMin).max(128, messages.nameMax),
      email: z.email(messages.emailInvalid).trim().toLowerCase(),
      password: z.string().min(8, messages.passwordMin).max(128, messages.passwordMax),
      confirmPassword: z.string().min(8, messages.passwordMin).max(128, messages.passwordMax),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    })
}

export function createForgotPasswordSchema(messages: ValidationMessages) {
  return z.object({
    email: z.email(messages.emailInvalid).trim().toLowerCase(),
  })
}

export function createResetPasswordSchema(messages: ValidationMessages) {
  return z
    .object({
      email: z.email(messages.emailInvalid).trim().toLowerCase(),
      token: z.string().regex(/^[a-f0-9]{64}$/, messages.tokenInvalid),
      password: z.string().min(8, messages.passwordMin).max(128, messages.passwordMax),
      confirmPassword: z.string().min(8, messages.passwordMin).max(128, messages.passwordMax),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ['confirmPassword'],
    })
}

export type AuthFormData = z.infer<ReturnType<typeof createAuthSchema>>
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>
export type AuthMode = 'login' | 'register'
