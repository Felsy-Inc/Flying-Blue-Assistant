import { locales, type Locale } from './locales'

const supported = new Set<string>(locales as unknown as string[])

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null
  const short = value.toLowerCase().split('-')[0] ?? ''
  return supported.has(short) ? (short as Locale) : null
}

/**
 * Pick best supported locale from an `Accept-Language` header (SSR-safe).
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null

  const parsed = header.split(',').map((part) => {
    const [rawTag, ...params] = part.trim().split(';')
    const tag = rawTag?.trim().toLowerCase() ?? ''
    const lang = tag.split('-')[0] ?? ''
    let q = 1
    for (const p of params) {
      const [k, v] = p.split('=').map((s) => s.trim())
      if (k === 'q' && v) {
        const n = Number.parseFloat(v)
        if (!Number.isNaN(n)) q = n
      }
    }
    return { lang, q }
  })

  parsed.sort((a, b) => b.q - a.q)

  for (const { lang } of parsed) {
    if (supported.has(lang)) return lang as Locale
  }

  return null
}

export function detectNavigatorLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const list = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const raw of list) {
    const match = normalizeLocale(raw)
    if (match) return match
  }
  return 'en'
}
