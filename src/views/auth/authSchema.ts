import { z } from 'zod'

export const authSchema = z.object({
  email: z.email('Email tidak valid').trim().toLowerCase(),
  password: z.string().min(8, 'Password minimal 8 karakter').max(128, 'Password terlalu panjang'),
})

export const registerSchema = authSchema.extend({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(128, 'Nama terlalu panjang'),
  email: z.email('Email tidak valid').trim().toLowerCase(),
  password: z.string().min(8, 'Password minimal 8 karakter').max(128, 'Password terlalu panjang'),
  confirmPassword: z.string().min(8, 'Password minimal 8 karakter').max(128, 'Password terlalu panjang'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan confirm password tidak cocok',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.email('Email tidak valid').trim().toLowerCase(),
})

export const resetPasswordSchema = z.object({
  email: z.email('Email tidak valid').trim().toLowerCase(),
  token: z.string().regex(/^[a-f0-9]{64}$/, 'Token reset tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(128, 'Password terlalu panjang'),
  confirmPassword: z.string().min(8, 'Password minimal 8 karakter').max(128, 'Password terlalu panjang'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan confirm password tidak cocok',
  path: ['confirmPassword'],
})

export type AuthFormData = z.infer<typeof authSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type AuthMode = 'login' | 'register'
