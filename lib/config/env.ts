import { z } from 'zod'

const publicEnvSchema = z.object({
  supabaseUrl: z.string().url().optional(),
  supabaseKey: z.string().min(1).optional(),
  appUrl: z.string().url(),
  billingEnabled: z.boolean(),
  featureFlags: z.object({
    useMockProvider: z.boolean(),
    emailsEnabled: z.boolean(),
    publicBrowseEnabled: z.boolean(),
    billingEnabled: z.boolean(),
  }),
})

const serverEnvSchema = z.object({
  databaseUrl: z.string().min(1).optional(),
  resendApiKey: z.string().min(1).optional(),
  /** `from` address; may include display name — not a plain RFC email string. */
  emailFrom: z.string().min(3).optional(),
  stripeSecretKey: z.string().min(1).optional(),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

export const readPublicEnv = (): PublicEnv => {
  const config = useRuntimeConfig()
  return publicEnvSchema.parse({
    supabaseUrl: config.public.supabaseUrl,
    supabaseKey: config.public.supabaseKey,
    appUrl: config.public.appUrl,
    billingEnabled: config.public.billingEnabled,
    featureFlags: config.public.featureFlags,
  })
}

export const readServerEnv = (): ServerEnv => {
  const config = useRuntimeConfig()
  return serverEnvSchema.parse({
    databaseUrl: config.databaseUrl,
    resendApiKey: config.resendApiKey,
    emailFrom: config.emailFrom,
    stripeSecretKey: config.stripeSecretKey,
  })
}
