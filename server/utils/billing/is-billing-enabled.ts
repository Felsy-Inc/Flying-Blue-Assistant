import type { H3Event } from 'h3'
import { ensureProjectDotenvForRuntime } from '../../../env/load-dotenv'

function envTruthy(v: string | undefined): boolean {
  if (v === undefined || v === '') return false
  const s = v.trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

/** First non-empty env value (skip `""` so we can fall through to the next key). */
function firstNonEmptyEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return undefined
}

function runtimePublicBillingOn(config: ReturnType<typeof useRuntimeConfig>): boolean {
  const v = config.public.billingEnabled
  if (v === true) return true
  if (typeof v === 'string') return envTruthy(v)
  return false
}

/**
 * Billing gate for API routes: merge `runtimeConfig.public`, then env (after ensuring
 * `.env` / `.env.local` were applied from the real project root).
 */
export function isBillingEnabled(event: H3Event): boolean {
  ensureProjectDotenvForRuntime()
  const config = useRuntimeConfig(event)
  if (runtimePublicBillingOn(config)) return true
  return envTruthy(
    firstNonEmptyEnv('NUXT_PUBLIC_BILLING_ENABLED', 'BILLING_ENABLED'),
  )
}
