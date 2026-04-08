import { computed } from 'vue'
import { localeSeoTags, type Locale } from '~lib/i18n/locales'

/**
 * Shared document head + default SEO for all layouts (marketing + app shell).
 */
export const useAppShellHead = () => {
  const { t, locale } = useT()
  const config = useRuntimeConfig()
  const nuxtUiLocale = useNuxtUiLocale()

  const ogImageUrl = computed(() => {
    const u = String(config.public.ogImageUrl ?? '').trim()
    if (!u) return undefined
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    const base = String(config.public.appUrl ?? '').replace(/\/$/, '').trim()
    if (!base) return undefined
    const path = u.startsWith('/') ? u : `/${u}`
    return `${base}${path}`
  })

  useHead(() => ({
    htmlAttrs: {
      lang: locale.value,
    },
    titleTemplate: (chunk) =>
      chunk ? `${chunk} · ${t('common.appName')}` : t('seo.siteTitle'),
  }))

  useSeoMeta({
    description: () => t('seo.defaultDescription'),
    ogSiteName: () => t('common.appName'),
    ogLocale: () => localeSeoTags[locale.value as Locale].ogLocale,
    ogImage: () => ogImageUrl.value,
    twitterImage: () => ogImageUrl.value,
  })

  return { nuxtUiLocale }
}
