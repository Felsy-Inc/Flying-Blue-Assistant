import { computed } from 'vue'
import { createTranslator } from '~lib/i18n'

export const useT = () => {
  const { locale } = useAppLocale()
  const translator = computed(() => createTranslator(locale.value))

  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => translator.value(key, vars),
  }
}
