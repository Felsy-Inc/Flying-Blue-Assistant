import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'

export async function requireSupabaseSession(event: Parameters<typeof serverSupabaseUser>[0]): Promise<{
  userId: string
  supabase: SupabaseClient<Database>
}> {
  const config = useRuntimeConfig(event)
  if (!config.public?.supabase?.url) {
    throw createError({ statusCode: 503, statusMessage: 'supabase_not_configured' })
  }

  const jwt = await serverSupabaseUser(event)
  const userId = jwt && typeof jwt.sub === 'string' ? jwt.sub : null
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const supabase = (await serverSupabaseClient(event)) as SupabaseClient<Database>
  return { userId, supabase }
}
