import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'
import { mockAvailabilityProvider } from '~lib/availability/mock-provider'
import type { AvailabilityProvider } from '~lib/availability/provider'
import { createCachedAvailabilityProvider } from './cached-provider'

export type ProviderMode = 'mock'

export function resolveAvailabilityProvider(
  mode: ProviderMode,
  serviceClient: SupabaseClient<Database> | null,
): AvailabilityProvider {
  const inner = mode === 'mock' ? mockAvailabilityProvider : mockAvailabilityProvider

  if (serviceClient) {
    return createCachedAvailabilityProvider(inner, serviceClient)
  }

  return inner
}
