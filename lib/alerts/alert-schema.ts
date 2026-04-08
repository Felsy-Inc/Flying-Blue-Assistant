import { z } from 'zod'
import { LOYALTY_PROGRAM_FLYING_BLUE } from '~lib/availability/domain'
import type { Database } from '~~/types/database.types'

type AlertInsert = Database['public']['Tables']['alerts']['Insert']
type AlertUpdate = Database['public']['Tables']['alerts']['Update']
export type AlertRow = Database['public']['Tables']['alerts']['Row']

const iata = z
  .string()
  .trim()
  .length(3)
  .regex(/^[a-zA-Z]{3}$/)
  .transform((s) => s.toUpperCase())

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')

/**
 * Raw object shape (no refinements) — Zod 4 forbids `.partial()` on schemas with `.superRefine()`.
 */
const alertUpsertShapeSchema = z.object({
  loyalty_program_slug: z.literal(LOYALTY_PROGRAM_FLYING_BLUE).default(LOYALTY_PROGRAM_FLYING_BLUE),
  origin_airport: iata,
  destination_airport: iata,
  trip_type: z.enum(['one_way', 'round_trip']),
  outbound_date_start: isoDate,
  outbound_date_end: isoDate.optional().nullable(),
  return_date_start: isoDate.optional().nullable(),
  return_date_end: isoDate.optional().nullable(),
  /** DB allows `first`; UI may omit — API accepts for round-trip edits. */
  cabin: z.enum(['economy', 'premium_economy', 'business', 'first']),
  passenger_count: z.coerce.number().int().min(1).max(9).default(1),
  max_miles: z.coerce.number().int().positive().optional().nullable(),
  max_taxes_eur: z.coerce.number().nonnegative().optional().nullable(),
  max_taxes_currency: z.string().min(3).max(3).default('EUR'),
  direct_only: z.boolean().default(false),
  status: z.enum(['active', 'paused']).default('active'),
})

/**
 * Alert criteria aligned with `public.alerts` + future worker processing.
 */
export const alertUpsertBodySchema = alertUpsertShapeSchema.superRefine((data, ctx) => {
  if (data.trip_type === 'round_trip' && !data.return_date_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'return_start_required', path: ['return_date_start'] })
  }
  if (data.outbound_date_end && data.outbound_date_end < data.outbound_date_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'outbound_range_invalid', path: ['outbound_date_end'] })
  }
  if (data.return_date_start && data.return_date_start <= data.outbound_date_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'return_after_outbound', path: ['return_date_start'] })
  }
  if (data.return_date_end && data.return_date_start && data.return_date_end < data.return_date_start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'return_range_invalid', path: ['return_date_end'] })
  }
})

export type AlertUpsertBody = z.infer<typeof alertUpsertBodySchema>

/** PATCH body: partial fields only; merged server-side then validated with `alertUpsertBodySchema`. */
export const alertPatchBodySchema = alertUpsertShapeSchema.partial()

export type AlertPatchBody = z.infer<typeof alertPatchBodySchema>

/** Map validated body → Supabase insert row (server). */
export function alertBodyToInsert(userId: string, body: AlertUpsertBody): AlertInsert {
  const maxTaxes =
    body.max_taxes_eur != null && body.max_taxes_eur !== undefined
      ? String(body.max_taxes_eur)
      : null

  return {
    user_id: userId,
    loyalty_program_slug: body.loyalty_program_slug,
    origin_airport: body.origin_airport,
    destination_airport: body.destination_airport,
    trip_type: body.trip_type,
    outbound_date_start: body.outbound_date_start,
    outbound_date_end: body.outbound_date_end ?? null,
    return_date_start: body.return_date_start ?? null,
    return_date_end: body.return_date_end ?? null,
    cabin: body.cabin,
    passenger_count: body.passenger_count,
    max_miles: body.max_miles ?? null,
    max_taxes_amount: maxTaxes,
    max_taxes_currency: body.max_taxes_currency ?? 'EUR',
    direct_only: body.direct_only,
    status: body.status,
  }
}

export function alertUpsertBodyToUpdate(body: AlertUpsertBody): AlertUpdate {
  const maxTaxes =
    body.max_taxes_eur != null && body.max_taxes_eur !== undefined
      ? String(body.max_taxes_eur)
      : null

  return {
    loyalty_program_slug: body.loyalty_program_slug,
    origin_airport: body.origin_airport,
    destination_airport: body.destination_airport,
    trip_type: body.trip_type,
    outbound_date_start: body.outbound_date_start,
    outbound_date_end: body.outbound_date_end ?? null,
    return_date_start: body.return_date_start ?? null,
    return_date_end: body.return_date_end ?? null,
    cabin: body.cabin,
    passenger_count: body.passenger_count,
    max_miles: body.max_miles ?? null,
    max_taxes_amount: maxTaxes,
    max_taxes_currency: body.max_taxes_currency ?? 'EUR',
    direct_only: body.direct_only,
    status: body.status,
  }
}

/** Map DB row → form-friendly object for editor prefill. */
export function alertRowToFormValues(row: AlertRow) {
  const taxes = row.max_taxes_amount != null ? Number.parseFloat(row.max_taxes_amount) : null
  return {
    loyalty_program_slug: row.loyalty_program_slug as typeof LOYALTY_PROGRAM_FLYING_BLUE,
    origin_airport: row.origin_airport,
    destination_airport: row.destination_airport,
    trip_type: row.trip_type,
    outbound_date_start: row.outbound_date_start,
    outbound_date_end: row.outbound_date_end,
    return_date_start: row.return_date_start,
    return_date_end: row.return_date_end,
    cabin: row.cabin as AlertUpsertBody['cabin'],
    passenger_count: row.passenger_count,
    max_miles: row.max_miles,
    max_taxes_eur: Number.isFinite(taxes) ? taxes : null,
    max_taxes_currency: row.max_taxes_currency ?? 'EUR',
    direct_only: row.direct_only,
    status: row.status,
  }
}
