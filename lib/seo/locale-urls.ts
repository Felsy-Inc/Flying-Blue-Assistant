import { locales, type Locale } from '~lib/i18n/locales'

export { locales }

/** Matches `strategy: prefix_except_default` with `defaultLocale: en`. */
export const DEFAULT_LOCALE: Locale = 'en'

export function siteBaseUrl(appUrl: string): string {
  return appUrl.replace(/\/$/, '').trim()
}

/**
 * Localized path for router / Nuxt i18n (`prefix_except_default`).
 * English has no prefix; nl/fr use `/nl/...`, `/fr/...`.
 */
export function pathWithLocale(locale: Locale, path: string): string {
  const clean = path === '' || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) return clean
  if (clean === '/') return `/${locale}`
  return `/${locale}${clean}`
}

/** Absolute public URL for a logical path (no locale prefix in `path`). */
export function absoluteUrlForLocale(base: string, locale: Locale, path: string): string {
  const b = siteBaseUrl(base)
  const p = pathWithLocale(locale, path)
  if (p === '/') return `${b}/`
  return `${b}${p}`
}

export function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
