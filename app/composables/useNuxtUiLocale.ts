import { computed } from 'vue'
import type { Locale } from '~lib/i18n/locales'

const uiLocaleByApp: Record<Locale, string> = {
  en: 'en-US',
  nl: 'nl-NL',
  fr: 'fr-FR',
}

/**
 * Map app locale to BCP-47 for Nuxt UI / Reka `ConfigProvider` (`UApp`).
 */
export const useNuxtUiLocale = () => {
  const { locale } = useAppLocale()

  return computed(() => ({
    code: uiLocaleByApp[locale.value],
    dir: 'ltr' as const,
  }))
}
