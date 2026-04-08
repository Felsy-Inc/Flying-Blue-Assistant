import { computed } from 'vue'
import type { Locale } from '~lib/i18n/locales'

export const useT = () => {
  const i18n = useI18n()

  return {
    t: (key: string, vars?: Record<string, string | number>) => i18n.t(key, (vars ?? {}) as Record<string, unknown>),
    locale: computed(() => i18n.locale.value as Locale),
  }
}
