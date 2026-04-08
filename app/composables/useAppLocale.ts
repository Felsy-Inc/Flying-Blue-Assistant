import { computed } from 'vue'
import { normalizeLocale } from '~lib/i18n'
import type { Locale } from '~lib/i18n/locales'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * App copy locale (en/nl/fr). SSR-safe: `useState` is seeded in `plugins/locale-init.ts`
 * from `fba-locale` cookie or `Accept-Language`; user changes persist via cookie + state.
 */
export const useAppLocale = () => {
  const cookie = useCookie<Locale | undefined>('fba-locale', {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  })

  const state = useState<Locale>('fba-app-locale', () => 'en')

  const locale = computed<Locale>(() => normalizeLocale(cookie.value) ?? state.value)

  const setLocale = (next: Locale) => {
    cookie.value = next
    state.value = next
  }

  return {
    locale,
    setLocale,
  }
}
