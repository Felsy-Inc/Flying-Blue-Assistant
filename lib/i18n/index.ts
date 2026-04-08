import type { Locale } from './locales'
import { en } from './messages/en'
import { nl } from './messages/nl'
import { fr } from './messages/fr'

export type { Locale } from './locales'
export { locales } from './locales'
export { normalizeLocale, parseAcceptLanguage, detectNavigatorLocale } from './detect'

export const messages = { en, nl, fr } as const

type AnyRecord = Record<string, unknown>

function getPath(obj: AnyRecord, path: string): unknown {
  const parts = path.split('.').filter(Boolean)
  let cur: unknown = obj

  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as AnyRecord)) {
      cur = (cur as AnyRecord)[part]
      continue
    }
    return undefined
  }

  return cur
}

export function createTranslator(locale: Locale) {
  const dict = messages[locale] as unknown as AnyRecord

  return (key: string, vars?: Record<string, string | number>) => {
    const value = getPath(dict, key)
    if (typeof value !== 'string') return key
    if (!vars) return value
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
      value,
    )
  }
}

