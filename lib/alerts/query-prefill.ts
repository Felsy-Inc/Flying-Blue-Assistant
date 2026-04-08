import type { AlertUpsertBody } from './alert-schema'

const CABINS = ['economy', 'premium_economy', 'business', 'first'] as const

function qp(q: Record<string, unknown>, key: string): string | undefined {
  const v = q[key]
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return undefined
}

/** Build alert form prefill from `/app/alerts` URL query (search handoff + manual links). */
export function alertPrefillFromRouteQuery(q: Record<string, unknown>): Partial<AlertUpsertBody> | null {
  const origin = qp(q, 'origin')
  if (!origin) return null

  const dest = (qp(q, 'destination') ?? '').toUpperCase()
  const trip = qp(q, 'tripType') === 'round_trip' ? 'round_trip' : 'one_way'
  const outbound = qp(q, 'outbound') ?? ''
  const outboundEnd = qp(q, 'outboundEnd')
  const ret = qp(q, 'return')
  const retEnd = qp(q, 'returnEnd')
  const cabinRaw = qp(q, 'cabin') ?? 'economy'
  const cabin = (CABINS as readonly string[]).includes(cabinRaw) ? (cabinRaw as AlertUpsertBody['cabin']) : 'economy'
  const pax = qp(q, 'pax') ? Number.parseInt(qp(q, 'pax')!, 10) : 1
  const maxMiles = qp(q, 'maxMiles') ? Number.parseInt(qp(q, 'maxMiles')!, 10) : undefined
  const maxTaxes = qp(q, 'maxTaxes') ? Number.parseFloat(qp(q, 'maxTaxes')!) : undefined
  const d = qp(q, 'direct')
  const direct = d === '1' || d === 'true'

  return {
    origin_airport: origin.toUpperCase(),
    destination_airport: dest,
    trip_type: trip,
    outbound_date_start: outbound,
    outbound_date_end: outboundEnd ?? null,
    return_date_start: ret ?? null,
    return_date_end: retEnd ?? null,
    cabin,
    passenger_count: Number.isFinite(pax) && pax > 0 ? pax : 1,
    max_miles: Number.isFinite(maxMiles) && maxMiles > 0 ? maxMiles : null,
    max_taxes_eur: Number.isFinite(maxTaxes) && maxTaxes >= 0 ? maxTaxes : null,
    direct_only: direct,
    status: 'active',
  }
}
