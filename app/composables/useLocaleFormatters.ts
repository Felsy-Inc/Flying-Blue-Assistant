import { computed } from 'vue'
import type { Locale } from '~lib/i18n/locales'

const bcp47: Record<Locale, string> = {
  en: 'en-GB',
  nl: 'nl-NL',
  fr: 'fr-FR',
}

/** Parse `YYYY-MM-DD` as a local calendar date (avoids UTC off-by-one). */
function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10))
  return new Date(y, m - 1, d)
}

export const useLocaleFormatters = () => {
  const { locale } = useAppLocale()
  const tag = computed(() => bcp47[locale.value])

  const formatMediumDate = (isoDate: string) =>
    new Intl.DateTimeFormat(tag.value, { dateStyle: 'medium' }).format(parseIsoDateLocal(isoDate))

  const formatEur = (amount: number) =>
    new Intl.NumberFormat(tag.value, { style: 'currency', currency: 'EUR' }).format(amount)

  const formatMiles = (n: number) =>
    new Intl.NumberFormat(tag.value, { maximumFractionDigits: 0 }).format(n)

  /** ISO datetime → short time (UTC; mock segments use Z). */
  const formatShortTimeUtc = (iso: string) =>
    new Intl.DateTimeFormat(tag.value, { timeStyle: 'short', timeZone: 'UTC' }).format(new Date(iso))

  return {
    formatMediumDate,
    formatEur,
    formatMiles,
    formatShortTimeUtc,
  }
}
