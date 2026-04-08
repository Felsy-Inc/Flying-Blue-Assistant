import { z } from 'zod'

export const magicLinkSchema = z.object({
  email: z.string().trim().email(),
})

export const passwordLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const signupSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'mismatch',
  })

export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>
export type SignupInput = z.infer<typeof signupSchema>
