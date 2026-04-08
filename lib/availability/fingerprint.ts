import { createHash } from 'node:crypto'
import type { AvailabilitySearchInput } from './domain-models'

/** Stable cache key for identical search criteria (provider-agnostic). */
export function availabilityRequestFingerprint(request: AvailabilitySearchInput): string {
  const normalized = {
    v: 1 as const,
    loyaltyProgramSlug: request.loyaltyProgramSlug,
    origin: request.origin,
    destination: request.destination,
    tripType: request.tripType,
    outboundDate: request.outboundDate,
    returnDate: request.returnDate ?? null,
    flexibilityDays: request.flexibilityDays,
    passengers: request.passengers,
    cabin: request.cabin,
    maxMiles: request.maxMiles ?? null,
    maxTaxesEur: request.maxTaxesEur ?? null,
    directOnly: request.directOnly ?? false,
  }
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}
