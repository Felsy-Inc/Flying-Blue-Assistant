import type { H3Event } from 'h3'

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the env var is set on the project.
 * In dev, if `CRON_SECRET` is unset, the route is allowed (log a warning) so you can trigger manually.
 */
export function assertCronSecret(event: H3Event): void {
  const secret = useRuntimeConfig(event).cronSecret
  const trimmed = typeof secret === 'string' ? secret.trim() : ''

  if (!trimmed) {
    if (import.meta.dev) {
      console.warn('[cron] CRON_SECRET unset — allowing /api/cron/process-alerts in dev only')
      return
    }
    throw createError({ statusCode: 503, statusMessage: 'cron_secret_not_configured' })
  }

  const auth = getHeader(event, 'authorization') ?? ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (bearer !== trimmed) {
    throw createError({ statusCode: 401, statusMessage: 'cron_unauthorized' })
  }
}
