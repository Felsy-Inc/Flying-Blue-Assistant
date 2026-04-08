import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '~~/types/database.types'
import type { AvailabilitySearchRequest, AvailabilitySearchResponse } from '~lib/availability/domain'
import { coerceNormalizedOffer } from '~lib/availability/mappers'
import { availabilityRequestFingerprint } from '~lib/availability/fingerprint'
import type { AvailabilityProvider } from '~lib/availability/provider'
import { getAvailabilityCacheByFingerprint, upsertAvailabilityCacheEntry } from '~~/server/utils/db/cache'

const DEFAULT_TTL_SECONDS = 15 * 60

/**
 * Wraps an inner provider with `availability_cache_entries` (service-role client).
 * Fails open to the inner provider if cache read/write errors.
 */
export function createCachedAvailabilityProvider(
  inner: AvailabilityProvider,
  serviceClient: SupabaseClient<Database>,
  options?: { ttlSeconds?: number },
): AvailabilityProvider {
  const ttlSeconds = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS

  return {
    id: `${inner.id}_cached`,
    getCapabilities: () => inner.getCapabilities(),
    async search(request: AvailabilitySearchRequest): Promise<AvailabilitySearchResponse> {
      const fingerprint = availabilityRequestFingerprint(request)
      const slug = request.loyaltyProgramSlug

      try {
        const cached = await getAvailabilityCacheByFingerprint(serviceClient, slug, fingerprint)
        if (cached?.payload && typeof cached.payload === 'object' && cached.payload !== null) {
          const payload = cached.payload as { response?: AvailabilitySearchResponse }
          if (payload.response) {
            const r = payload.response
            return {
              ...r,
              cacheHit: true,
              offers: r.offers.map((o) => coerceNormalizedOffer(o)),
            }
          }
        }
      } catch {
        /* ignore */
      }

      const response = await inner.search(request)

      try {
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
        await upsertAvailabilityCacheEntry(serviceClient, {
          loyalty_program_slug: slug,
          fingerprint,
          search_params: JSON.parse(JSON.stringify(request)) as Json,
          payload: JSON.parse(JSON.stringify({ response })) as Json,
          expires_at: expiresAt,
          source: inner.id,
        })
      } catch {
        /* ignore */
      }

      return { ...response, cacheHit: false }
    },
  }
}
