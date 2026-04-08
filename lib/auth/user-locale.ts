import { locales, type Locale } from '~lib/i18n/locales'

/** Reads optional `app_locale` from Supabase Auth `user_metadata` (set by client later). */
export function localeFromUserMetadata(meta: unknown): Locale {
  if (!meta || typeof meta !== 'object') return 'en'
  const raw = (meta as Record<string, unknown>).app_locale
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return 'en'
}
