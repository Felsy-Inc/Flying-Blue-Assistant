import type { Locale } from '~lib/i18n/locales'
import { localeSeoTags } from '~lib/i18n/locales'
import {
  absoluteUrlForLocale,
  DEFAULT_LOCALE,
  locales,
  siteBaseUrl,
} from '~lib/seo/locale-urls'

/**
 * Self canonical + hreflang alternates for a logical marketing path (e.g. `/`, `/pricing`).
 */
export function useMarketingLocaleSeo(path: string) {
  const config = useRuntimeConfig()
  const { locale } = useI18n()

  const base = computed(() => siteBaseUrl(String(config.public.appUrl ?? '')))

  useHead(() => {
    const b = base.value
    if (!b) return {}

    const current = locale.value as Locale
    const links: Array<Record<string, string>> = [
      { rel: 'canonical', href: absoluteUrlForLocale(b, current, path) },
      ...locales.map((loc) => ({
        rel: 'alternate',
        hreflang: localeSeoTags[loc].hreflang,
        href: absoluteUrlForLocale(b, loc, path),
      })),
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: absoluteUrlForLocale(b, DEFAULT_LOCALE, path),
      },
    ]

    return { link: links }
  })
}
