/**
 * Public surface for HTTP + Vue: flattened offers and search response.
 * Canonical domain builds use `domain-models` + `mappers.searchResultToNormalizedOffer`.
 */

import type {
  AwardValueLabel,
  AvailabilitySearchInput,
  AvailabilitySegment,
  AwardCabin,
  TripType,
  ValueTier,
} from './domain-models'

export * from './domain-models'

/** @deprecated Prefer `AvailabilitySearchInput` in new code; identical shape. */
export type AvailabilitySearchRequest = AvailabilitySearchInput

/** @deprecated Prefer `AvailabilitySegment`. */
export type AwardLegSegment = AvailabilitySegment

export interface NormalizedAwardOffer {
  id: string
  loyaltyProgramSlug: string
  tripType: TripType
  outboundDate: string
  returnDate?: string | null
  cabin: AwardCabin
  milesPerPassenger: number
  taxesPerPassenger: { amount: number; currency: string }
  stopsOutbound: number
  stopsReturn?: number
  segmentsOutbound: AvailabilitySegment[]
  segmentsReturn?: AvailabilitySegment[]
  /** Derived from `valueLabel` for sorts and legacy UI. */
  valueTier: ValueTier
  /** Primary product label (Promo, Strong value, …). */
  valueLabel: AwardValueLabel
  seatsLabel?: 'good' | 'few' | 'waitlist'
}

export interface AvailabilitySearchResponse {
  generatedAt: string
  request: AvailabilitySearchRequest
  outboundDatesInWindow: string[]
  offers: NormalizedAwardOffer[]
  cacheHit?: boolean
}
