/**
 * Core availability domain — provider-agnostic models for Flying Blue MVP.
 * API/UI consume flattened `NormalizedAwardOffer` (see `domain.ts`); providers build `AvailabilitySearchResult` first.
 */

export const LOYALTY_PROGRAM_FLYING_BLUE = 'flying_blue' as const

export type TripType = 'one_way' | 'round_trip'

/** Aligns with DB `alerts.cabin` (first class omitted in MVP search UI). */
export type AwardCabin = 'economy' | 'premium_economy' | 'business'

/** Legacy 4-bucket tier; still exposed on API offers for sorting and gradual UI migration. */
export type ValueTier = 'great' | 'good' | 'fair' | 'weak'

/**
 * Human-facing value / promo labels (primary product vocabulary).
 * Mapped to `ValueTier` for backward-compatible badges and sorts.
 */
export type AwardValueLabel = 'promo' | 'strong_value' | 'good' | 'fair' | 'high_surcharges'

export interface AwardValueAssessment {
  label: AwardValueLabel
  milesRatioToBaseline?: number
  taxRatioToTypical?: number
}

/** Search parameters — canonical input to any availability provider. */
export interface AvailabilitySearchInput {
  loyaltyProgramSlug: typeof LOYALTY_PROGRAM_FLYING_BLUE
  origin: string
  destination: string
  tripType: TripType
  /** ISO YYYY-MM-DD */
  outboundDate: string
  returnDate?: string | null
  /** Days ± around outbound (and return when round-trip). */
  flexibilityDays: number
  passengers: number
  cabin: AwardCabin
  maxMiles?: number | null
  maxTaxesEur?: number | null
  directOnly?: boolean
}

/** One flight segment (provider-normalized). */
export interface AvailabilitySegment {
  origin: string
  destination: string
  /** ISO 8601 */
  departureAt: string
  arrivalAt: string
  airlineCode: string
  airlineName: string
  flightNumber: string
  durationMinutes: number
}

/** One direction of travel (outbound or return). */
export interface AvailabilityItinerary {
  direction: 'outbound' | 'return'
  stops: number
  segments: AvailabilitySegment[]
}

/** Award price for the whole quoted journey (per passenger). */
export interface AvailabilityPrice {
  milesPerPassenger: number
  taxes: { amount: number; currency: string }
}

export type SeatsAvailabilityHint = 'good' | 'few' | 'waitlist'

/**
 * Single bookable-ish quote in domain form.
 * Providers emit these; `mappers.ts` flattens to `NormalizedAwardOffer` for JSON API + Vue.
 */
export interface AvailabilitySearchResult {
  id: string
  loyaltyProgramSlug: string
  tripType: TripType
  outboundDate: string
  returnDate?: string | null
  cabin: AwardCabin
  outbound: AvailabilityItinerary
  return?: AvailabilityItinerary
  price: AvailabilityPrice
  seatsAvailability?: SeatsAvailabilityHint
  assessment: AwardValueAssessment
}

/** Static / discoverable limits of a provider implementation. */
export interface ProviderCapabilities {
  providerId: string
  loyaltyProgramSlug: typeof LOYALTY_PROGRAM_FLYING_BLUE
  /** How data is obtained (for ops, logging, feature flags). */
  dataSource: 'mock' | 'partner_api' | 'ingestion' | 'composite'
  supportsRoundTrip: boolean
  supportsDateFlexibility: boolean
  supportsCabinFilter: boolean
  supportsDirectOnlyFilter: boolean
  maxFlexibilityDays?: number
}

/** Metadata for one search execution (audit, cache, debugging). */
export interface AvailabilitySearchContext {
  generatedAt: string
  providerId: string
  cacheHit?: boolean
  latencyMs?: number
  warnings?: string[]
}
