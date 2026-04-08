import type { SupabaseClient } from '@supabase/supabase-js'
import type { Json } from '~~/types/database.types'
import type { Database } from '~~/types/database.types'
import { isMissingDbObjectError } from './supabase-errors'

function utcDayBoundsIso(dayUtc: string): { start: string; endExclusive: string } {
  const start = `${dayUtc}T00:00:00.000Z`
  const d = new Date(`${dayUtc}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return { start, endExclusive: `${y}-${m}-${day}T00:00:00.000Z` }
}

/** Count usage rows for a calendar UTC day (aligns with DB index expression). */
export async function countUsageEventsForUtcDay(
  client: SupabaseClient<Database>,
  userId: string,
  eventType: string,
  dayUtc: string,
): Promise<number> {
  const { start, endExclusive } = utcDayBoundsIso(dayUtc)
  const { count, error } = await client
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .gte('created_at', start)
    .lt('created_at', endExclusive)

  if (error) {
    if (isMissingDbObjectError(error)) return 0
    throw error
  }
  return count ?? 0
}

export async function insertUsageEvent(
  client: SupabaseClient<Database>,
  row: {
    user_id: string
    loyalty_program_slug?: string | null
    event_type: string
    metadata?: Json
  },
) {
  const { data, error } = await client
    .from('usage_events')
    .insert({
      user_id: row.user_id,
      loyalty_program_slug: row.loyalty_program_slug ?? null,
      event_type: row.event_type,
      metadata: row.metadata ?? {},
    })
    .select('id')
    .single()

  if (error) {
    if (isMissingDbObjectError(error)) return null
    throw error
  }
  return data
}
