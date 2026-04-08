import { z } from 'zod'
import { LOYALTY_PROGRAM_FLYING_BLUE, type AvailabilitySearchRequest } from './domain'

const iata = z
  .string()
  .trim()
  .length(3)
  .regex(/^[a-zA-Z]{3}$/, 'IATA')
  .transform((s) => s.toUpperCase())

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')

export const availabilitySearchBodySchema = z
  .object({
    loyaltyProgramSlug: z.literal(LOYALTY_PROGRAM_FLYING_BLUE).default(LOYALTY_PROGRAM_FLYING_BLUE),
    origin: iata,
    destination: iata,
    tripType: z.enum(['one_way', 'round_trip']),
    outboundDate: isoDate,
    returnDate: isoDate.optional().nullable(),
    flexibilityDays: z.coerce.number().int().min(0).max(14).default(0),
    passengers: z.coerce.number().int().min(1).max(9).default(1),
    cabin: z.enum(['economy', 'premium_economy', 'business']),
    maxMiles: z.coerce.number().int().positive().optional().nullable(),
    maxTaxesEur: z.coerce.number().positive().optional().nullable(),
    directOnly: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.tripType === 'round_trip' && !data.returnDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'returnDate_required',
        path: ['returnDate'],
      })
    }
    if (data.returnDate && data.outboundDate && data.returnDate <= data.outboundDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'return_after_outbound',
        path: ['returnDate'],
      })
    }
  })

export type AvailabilitySearchBodyInput = z.input<typeof availabilitySearchBodySchema>
export type AvailabilitySearchBody = z.output<typeof availabilitySearchBodySchema>

export function toAvailabilitySearchRequest(parsed: AvailabilitySearchBody): AvailabilitySearchRequest {
  return {
    loyaltyProgramSlug: LOYALTY_PROGRAM_FLYING_BLUE,
    origin: parsed.origin,
    destination: parsed.destination,
    tripType: parsed.tripType,
    outboundDate: parsed.outboundDate,
    returnDate: parsed.returnDate ?? null,
    flexibilityDays: parsed.flexibilityDays,
    passengers: parsed.passengers,
    cabin: parsed.cabin,
    maxMiles: parsed.maxMiles ?? null,
    maxTaxesEur: parsed.maxTaxesEur ?? null,
    directOnly: parsed.directOnly,
  }
}
