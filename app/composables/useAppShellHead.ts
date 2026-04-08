/**
 * Shared document head + default SEO for all layouts (marketing + app shell).
 */
export const useAppShellHead = () => {
  const { t, locale } = useT()
  const nuxtUiLocale = useNuxtUiLocale()

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
  })

  return { nuxtUiLocale }
}
