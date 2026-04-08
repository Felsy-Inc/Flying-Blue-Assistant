import type { Locale } from '~lib/i18n/locales'
import {
  formatAlertOutboundDates,
  formatAlertReturnDates,
  formatMilesValue,
  formatMoneyAmount,
} from '~lib/email/alert-format'
import { getAlertEmailCopy } from '~lib/email/alert-copy'
import type { AlertEmailFields } from '~lib/email/alert-payload'

const brandNavy = '#0f2940'
const brandAccent = '#2563eb'
const muted = '#64748b'

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export type RenderAlertEmailResult = {
  subject: string
  html: string
  text: string
}

export function renderAlertEmail(
  locale: Locale,
  alert: AlertEmailFields,
  appUrl: string,
  options?: { isSample?: boolean; isMatch?: boolean },
): RenderAlertEmailResult {
  const copy = getAlertEmailCopy(locale)
  const route = `${alert.origin_airport} → ${alert.destination_airport}`
  const isMatch = Boolean(options?.isMatch)
  const subjectKey = isMatch ? copy.subjectNewMatches : copy.subjectRoute
  const subject = subjectKey
    .replace('{origin}', alert.origin_airport)
    .replace('{destination}', alert.destination_airport)

  const tripLabel =
    alert.trip_type === 'one_way' ? copy.trip.oneWay : copy.trip.roundTrip

  const outbound = formatAlertOutboundDates(locale, alert.outbound_date_start, alert.outbound_date_end)
  const ret =
    alert.trip_type === 'round_trip'
      ? formatAlertReturnDates(locale, alert.return_date_start, alert.return_date_end)
      : '—'

  const cabinLabel = copy.cabin[alert.cabin]

  const milesLabel = alert.max_miles != null ? copy.labels.milesMax : copy.labels.miles
  const milesValue =
    alert.max_miles != null ? formatMilesValue(locale, alert.max_miles) : '—'

  let taxesValue = copy.labels.taxesNone
  if (alert.max_taxes_amount != null && alert.max_taxes_currency) {
    const n = Number.parseFloat(alert.max_taxes_amount)
    if (!Number.isNaN(n)) {
      taxesValue = formatMoneyAmount(locale, n, alert.max_taxes_currency)
    }
  }

  const ctaUrl = `${appUrl.replace(/\/$/, '')}/app/alerts`
  const sampleNote = options?.isSample ? `<p style="margin:0 0 16px;font-size:13px;color:${muted};">${esc(copy.sampleBadge)}</p>` : ''
  const headline = isMatch ? copy.headlineMatch : copy.headline
  const intro = isMatch ? copy.introMatch : copy.intro

  const rows: [string, string][] = [
    [copy.labels.route, esc(route)],
    [copy.labels.tripType, esc(tripLabel)],
    [copy.labels.dates, alert.trip_type === 'round_trip' ? `${esc(outbound)} / ${esc(ret)}` : esc(outbound)],
    [copy.labels.cabin, esc(cabinLabel)],
    [milesLabel, esc(milesValue)],
    [copy.labels.taxes, esc(taxesValue)],
  ]

  const rowHtml = rows
    .map(
      ([k, v]) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:${muted};font-size:14px;width:38%;vertical-align:top;">${esc(k)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;vertical-align:top;">${v}</td>
  </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:#f1f5f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,41,64,0.08);">
          <tr>
            <td style="padding:24px 24px 8px;background:${brandNavy};color:#fff;">
              <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">${esc(copy.brandName)}</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;">${esc(headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 8px;">
              ${sampleNote}
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#334155;">${esc(intro)}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rowHtml}</table>
              <p style="margin:24px 0 8px;">
                <a href="${esc(ctaUrl)}" style="display:inline-block;background:${brandAccent};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:8px;">${esc(copy.cta)}</a>
              </p>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.45;color:${muted};">${esc(copy.footer)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const datesText =
    alert.trip_type === 'round_trip' ? `${outbound} / ${ret}` : outbound

  const text = [
    copy.brandName,
    '',
    headline,
    intro,
    '',
    `${copy.labels.route}: ${route}`,
    `${copy.labels.tripType}: ${tripLabel}`,
    `${copy.labels.dates}: ${datesText}`,
    `${copy.labels.cabin}: ${cabinLabel}`,
    `${milesLabel}: ${milesValue}`,
    `${copy.labels.taxes}: ${taxesValue}`,
    '',
    `${copy.cta}: ${ctaUrl}`,
    '',
    copy.footer,
  ].join('\n')

  return { subject, html, text }
}
