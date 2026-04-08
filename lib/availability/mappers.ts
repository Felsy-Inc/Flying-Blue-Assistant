import type {
  AwardValueLabel,
  AvailabilitySearchContext,
  AvailabilitySearchInput,
  AvailabilitySearchResult,
  ValueTier,
} from './domain-models'
import type { AvailabilitySearchResponse, NormalizedAwardOffer } from './domain'
import { valueLabelToLegacyTier } from './value-labels'

export { compareAwardValueLabels } from './value-labels'

const TIER_FALLBACK_LABEL: Record<ValueTier, AwardValueLabel> = {
  great: 'strong_value',
  good: 'good',
  fair: 'fair',
  weak: 'high_surcharges',
}

/** Cache rows minted before `valueLabel` existed — backfill from legacy `valueTier`. */
export function coerceNormalizedOffer(
  o: NormalizedAwardOffer & { valueLabel?: AwardValueLabel },
): NormalizedAwardOffer {
  if (o.valueLabel) {
    return o as NormalizedAwardOffer
  }
  return {
    ...o,
    valueLabel: TIER_FALLBACK_LABEL[o.valueTier],
  }
}

/**
 * Flatten a domain result into the API / UI shape (no nested itineraries).
 */
export function searchResultToNormalizedOffer(r: AvailabilitySearchResult): NormalizedAwardOffer {
  const tier = valueLabelToLegacyTier(r.assessment.label)
  return {
    id: r.id,
    loyaltyProgramSlug: r.loyaltyProgramSlug,
    tripType: r.tripType,
    outboundDate: r.outboundDate,
    returnDate: r.returnDate,
    cabin: r.cabin,
    milesPerPassenger: r.price.milesPerPassenger,
    taxesPerPassenger: { amount: r.price.taxes.amount, currency: r.price.taxes.currency },
    stopsOutbound: r.outbound.stops,
    stopsReturn: r.return?.stops,
    segmentsOutbound: r.outbound.segments,
    segmentsReturn: r.return?.segments,
    seatsLabel: r.seatsAvailability,
    valueTier: tier,
    valueLabel: r.assessment.label,
  }
}

export function searchResultsToApiResponse(
  input: AvailabilitySearchInput,
  results: AvailabilitySearchResult[],
  context: Omit<AvailabilitySearchContext, 'generatedAt'> & { generatedAt?: string },
): AvailabilitySearchResponse {
  const generatedAt = context.generatedAt ?? new Date().toISOString()
  const offers = results.map(searchResultToNormalizedOffer)
  const outboundDatesInWindow = [...new Set(offers.map((x) => x.outboundDate))].sort()

  return {
    generatedAt,
    request: input,
    outboundDatesInWindow,
    offers,
    cacheHit: context.cacheHit,
  }
}
