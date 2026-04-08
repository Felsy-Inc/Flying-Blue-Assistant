import type { AlertRow } from '~lib/alerts/alert-schema'
import {
  LOYALTY_PROGRAM_FLYING_BLUE,
  type AvailabilitySearchRequest,
  type AwardCabin,
} from '~lib/availability/domain'
import { parseIsoDateUtc } from '~lib/availability/date-utils'

function calendarDaysBetweenInclusive(startIso: string, endIso: string): number {
  const a = parseIsoDateUtc(startIso).getTime()
  const b = parseIsoDateUtc(endIso).getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/** Mock provider only defines economy / premium_economy / business. */
function alertCabinToSearchCabin(cabin: AlertRow['cabin']): AwardCabin {
  if (cabin === 'first') return 'business'
  return cabin
}

/**
 * Map a DB alert row to a provider search request.
 * Uses the outbound (and return) date ranges to derive `flexibilityDays` (capped at 14).
 */
export function alertRowToAvailabilitySearchRequest(row: AlertRow): AvailabilitySearchRequest {
  const outboundEnd = row.outbound_date_end ?? row.outbound_date_start
  const outboundFlex = calendarDaysBetweenInclusive(row.outbound_date_start, outboundEnd)

  let returnFlex = 0
  if (row.trip_type === 'round_trip' && row.return_date_start) {
    const retEnd = row.return_date_end ?? row.return_date_start
    returnFlex = calendarDaysBetweenInclusive(row.return_date_start, retEnd)
  }

  const flexibilityDays = Math.min(14, Math.max(outboundFlex, returnFlex))

  let maxTaxesEur: number | null = null
  if (row.max_taxes_currency?.toUpperCase() === 'EUR' && row.max_taxes_amount != null) {
    const n = Number.parseFloat(row.max_taxes_amount)
    if (Number.isFinite(n) && n >= 0) maxTaxesEur = n
  }

  return {
    loyaltyProgramSlug: LOYALTY_PROGRAM_FLYING_BLUE,
    origin: row.origin_airport,
    destination: row.destination_airport,
    tripType: row.trip_type,
    outboundDate: row.outbound_date_start,
    returnDate: row.trip_type === 'round_trip' ? row.return_date_start : null,
    flexibilityDays,
    passengers: row.passenger_count,
    cabin: alertCabinToSearchCabin(row.cabin),
    maxMiles: row.max_miles,
    maxTaxesEur,
    directOnly: row.direct_only,
  }
}
