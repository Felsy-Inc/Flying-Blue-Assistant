import type { AlertRow } from '~lib/alerts/alert-schema'

/** Fields required to render the MVP alert email (DB row or sample). */
export type AlertEmailFields = Pick<
  AlertRow,
  | 'id'
  | 'origin_airport'
  | 'destination_airport'
  | 'trip_type'
  | 'outbound_date_start'
  | 'outbound_date_end'
  | 'return_date_start'
  | 'return_date_end'
  | 'cabin'
  | 'max_miles'
  | 'max_taxes_amount'
  | 'max_taxes_currency'
>

export function alertRowToEmailFields(row: AlertRow): AlertEmailFields {
  return {
    id: row.id,
    origin_airport: row.origin_airport,
    destination_airport: row.destination_airport,
    trip_type: row.trip_type,
    outbound_date_start: row.outbound_date_start,
    outbound_date_end: row.outbound_date_end,
    return_date_start: row.return_date_start,
    return_date_end: row.return_date_end,
    cabin: row.cabin,
    max_miles: row.max_miles,
    max_taxes_amount: row.max_taxes_amount,
    max_taxes_currency: row.max_taxes_currency,
  }
}

/** Placeholder row for test sends when the user has no alerts yet. */
export function sampleAlertEmailFields(): AlertEmailFields {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    origin_airport: 'AMS',
    destination_airport: 'JFK',
    trip_type: 'round_trip',
    outbound_date_start: '2026-06-10',
    outbound_date_end: '2026-06-14',
    return_date_start: '2026-06-20',
    return_date_end: null,
    cabin: 'business',
    max_miles: 125_000,
    max_taxes_amount: '450.00',
    max_taxes_currency: 'EUR',
  }
}
