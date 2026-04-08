import { computed } from 'vue'
import { normalizeLocale } from '~lib/i18n'
import type { Locale } from '~lib/i18n/locales'

/**
 * App UI locale — backed by `@nuxtjs/i18n` (routes + vue-i18n).
 * Keeps the same surface as before for `FbaLocaleSwitcher`, `useT`, etc.
 */
export const useAppLocale = () => {
  const { locale, setLocale: setI18nLocale } = useI18n()

  const localeRef = computed<Locale>(() => normalizeLocale(String(locale.value)) ?? 'en')

  const setLocale = (next: Locale) => {
    setI18nLocale(next)
  }

  return {
    locale: localeRef,
    setLocale,
  }
}
