import { normalizeLocale, parseAcceptLanguage, type Locale } from '~lib/i18n'

export default defineNuxtPlugin({
  name: 'fba-locale-init',
  enforce: 'pre',
  setup() {
    const cookie = useCookie<Locale | undefined>('fba-locale', {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    })

    const state = useState<Locale>('fba-app-locale', () => 'en')

    if (import.meta.server) {
      const fromCookie = normalizeLocale(cookie.value)
      state.value = fromCookie ?? parseAcceptLanguage(useRequestHeaders()['accept-language']) ?? 'en'
      return
    }

    const fromCookie = normalizeLocale(cookie.value)
    if (fromCookie) state.value = fromCookie
  },
})
