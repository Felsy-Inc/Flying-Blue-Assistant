import type { Locale } from '~lib/i18n/locales'

/** BCP 47 tags for `Intl` in transactional emails (aligned with `useLocaleFormatters`). */
export const emailLocaleBcp47: Record<Locale, string> = {
  en: 'en-GB',
  nl: 'nl-NL',
  fr: 'fr-FR',
}
