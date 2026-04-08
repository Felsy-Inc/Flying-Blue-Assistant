import { createHash } from 'node:crypto'
import type { AlertRow } from '~lib/alerts/alert-schema'
import type { NormalizedAwardOffer } from '~lib/availability/domain'

function isoInRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end
}

/**
 * Keeps offers whose travel dates fall inside the alert’s outbound (and return) windows.
 * Provider search may widen dates via flexibility; this tightens to the user’s criteria.
 */
export function filterOffersForAlertCriteria(
  alert: AlertRow,
  offers: NormalizedAwardOffer[],
): NormalizedAwardOffer[] {
  const obEnd = alert.outbound_date_end ?? alert.outbound_date_start

  return offers.filter((o) => {
    if (!isoInRange(o.outboundDate, alert.outbound_date_start, obEnd)) return false
    if (alert.trip_type === 'round_trip') {
      if (!o.returnDate || !alert.return_date_start) return false
      const retEnd = alert.return_date_end ?? alert.return_date_start
      if (!isoInRange(o.returnDate, alert.return_date_start, retEnd)) return false
    }
    return true
  })
}

export type MatchDigestPayload = {
  v: 1
  offerIds: string[]
  snapshots: { id: string; ob: string; ret: string | null; miles: number; tax: number }[]
}

/**
 * Stable hash over matching offers so unchanged result sets do not re-trigger email.
 */
export function digestForMatchedOffers(offers: NormalizedAwardOffer[]): string {
  const snapshots = offers
    .map((o) => ({
      id: o.id,
      ob: o.outboundDate,
      ret: o.returnDate ?? null,
      miles: o.milesPerPassenger,
      tax: o.taxesPerPassenger.amount,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const payload: MatchDigestPayload = { v: 1, offerIds: snapshots.map((s) => s.id), snapshots }
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}
