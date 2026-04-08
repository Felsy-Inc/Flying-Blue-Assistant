export const locales = ['en', 'nl', 'fr'] as const
export type Locale = (typeof locales)[number]

/** BCP 47 tags for `hreflang` and Open Graph locale. */
export const localeSeoTags: Record<Locale, { hreflang: string; ogLocale: string }> = {
  en: { hreflang: 'en-US', ogLocale: 'en_US' },
  nl: { hreflang: 'nl-NL', ogLocale: 'nl_NL' },
  fr: { hreflang: 'fr-FR', ogLocale: 'fr_FR' },
}
