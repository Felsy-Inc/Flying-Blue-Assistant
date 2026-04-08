import type {
  AvailabilitySearchInput,
  AvailabilitySearchResult,
  ProviderCapabilities,
} from './domain-models'
import type { AvailabilitySearchResponse } from './domain'

/**
 * Pluggable award availability source.
 * Implementations return the **API-shaped** `AvailabilitySearchResponse` so Nitro routes,
 * cache, and cron jobs stay decoupled from how results were produced (mock, HTTP API, ingestion).
 *
 * @see ./README.md — plugging in a real provider
 */
export interface AvailabilityProvider {
  readonly id: string
  /** Discoverable limits / provenance for UI (debug) and routing. */
  getCapabilities(): ProviderCapabilities
  search(request: AvailabilitySearchInput): Promise<AvailabilitySearchResponse>
}

/**
 * Optional persistence for search responses (Supabase `availability_cache_entries` implements this pattern server-side).
 */
export interface AvailabilitySearchCache {
  get(params: {
    loyaltyProgramSlug: string
    fingerprint: string
  }): Promise<AvailabilitySearchResponse | null>

  set(params: {
    loyaltyProgramSlug: string
    fingerprint: string
    response: AvailabilitySearchResponse
    ttlSeconds: number
    source: string
  }): Promise<void>
}

/**
 * External feeds (partner JSON, scraped HTML, polled snapshots) map **raw** payloads into
 * domain results. Keep one normalizer per source; compose providers if needed.
 */
export interface AvailabilitySearchNormalizer<TRaw = unknown> {
  readonly sourceId: string
  normalize(raw: TRaw, input: AvailabilitySearchInput): AvailabilitySearchResult[]
}
