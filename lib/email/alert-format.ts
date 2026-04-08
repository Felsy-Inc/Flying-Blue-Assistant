import type { Locale } from '~lib/i18n/locales'
import { emailLocaleBcp47 } from './locale-bcp47'

function parseIsoDateLocal(iso: string): Date {
  const parts = iso.split('-')
  const y = Number.parseInt(parts[0] ?? '0', 10)
  const mo = Number.parseInt(parts[1] ?? '1', 10)
  const d = Number.parseInt(parts[2] ?? '1', 10)
  return new Date(y, mo - 1, d)
}

function formatMediumDate(locale: Locale, iso: string): string {
  const tag = emailLocaleBcp47[locale] ?? emailLocaleBcp47.en
  return new Intl.DateTimeFormat(tag, { dateStyle: 'medium' }).format(parseIsoDateLocal(iso))
}

function formatDateSpan(locale: Locale, start: string, end: string | null): string {
  if (!end || end === start) return formatMediumDate(locale, start)
  return `${formatMediumDate(locale, start)} – ${formatMediumDate(locale, end)}`
}

export function formatAlertOutboundDates(
  locale: Locale,
  start: string,
  end: string | null,
): string {
  return formatDateSpan(locale, start, end)
}

export function formatAlertReturnDates(
  locale: Locale,
  start: string | null,
  end: string | null,
): string {
  if (!start) return '—'
  return formatDateSpan(locale, start, end)
}

export function formatMilesValue(locale: Locale, miles: number): string {
  const tag = emailLocaleBcp47[locale] ?? emailLocaleBcp47.en
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(miles)
}

export function formatMoneyAmount(locale: Locale, amount: number, currency: string): string {
  const tag = emailLocaleBcp47[locale] ?? emailLocaleBcp47.en
  return new Intl.NumberFormat(tag, { style: 'currency', currency }).format(amount)
}
