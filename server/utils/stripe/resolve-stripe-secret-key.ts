import type { H3Event } from 'h3'
import { ensureProjectDotenvForRuntime } from '../../../env/load-dotenv'

function firstNonEmptyEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return undefined
}

/**
 * Stripe secret for API routes: prefer `process.env` after loading project `.env`,
 * then Nuxt's `NUXT_STRIPE_SECRET_KEY`, then `runtimeConfig` (baked at process start).
 */
export function resolveStripeSecretKey(event: H3Event): string | undefined {
  ensureProjectDotenvForRuntime()
  return (
    firstNonEmptyEnv('STRIPE_SECRET_KEY', 'NUXT_STRIPE_SECRET_KEY') ??
    useRuntimeConfig(event).stripeSecretKey?.trim()
  )
}
