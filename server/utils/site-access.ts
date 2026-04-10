import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const SITE_GATE_COOKIE = 'fba_site_gate'

export function isSiteAccessConfigured(): boolean {
  return Boolean(process.env.SITE_ACCESS_PASSWORD?.trim())
}

/** Strip `/nl` / `/fr` prefix so exempt rules match locale-prefixed URLs (e.g. `/nl/auth/confirm`). */
function pathWithoutLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/(nl|fr)(?=\/)/, '')
}

/** Paths that must stay reachable without the gate cookie (webhooks, auth return URL, assets). */
export function siteAccessExemptPath(pathname: string): boolean {
  const p = pathname.split('?')[0] ?? pathname
  if (p === '/favicon.ico' || p === '/robots.txt') return true
  const normalized = pathWithoutLocalePrefix(p)
  const prefixes = [
    '/_nuxt',
    '/__nuxt',
    '/api/site-access',
    '/api/stripe/webhook',
    '/api/cron/process-alerts',
    '/site-access',
    '/auth/',
  ]
  return prefixes.some(
    (pre) =>
      p === pre ||
      p.startsWith(`${pre}/`) ||
      normalized === pre ||
      normalized.startsWith(`${pre}/`),
  )
}

function signingSecretBuf(password: string): Buffer {
  return createHash('sha256').update(`fba-site-gate-v1|${password}`, 'utf8').digest()
}

export function makeSiteGateToken(password: string, ttlSec: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  const secret = signingSecretBuf(password)
  const sig = createHmac('sha256', secret).update(String(exp)).digest('base64url')
  return `${exp}.${sig}`
}

export function verifySiteGateToken(token: string | undefined, password: string): boolean {
  const trimmed = password.trim()
  if (!token || !trimmed) return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const expStr = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() / 1000 > exp) return false
  const secret = signingSecretBuf(trimmed)
  const expectedSig = createHmac('sha256', secret).update(String(exp)).digest('base64url')
  try {
    return timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expectedSig, 'utf8'))
  } catch {
    return false
  }
}

export function verifySiteAccessPassword(input: string, expected: string): boolean {
  const exp = expected.trim()
  if (!input || !exp) return false
  const ha = createHash('sha256').update(input, 'utf8').digest()
  const hb = createHash('sha256').update(exp, 'utf8').digest()
  return timingSafeEqual(ha, hb)
}
