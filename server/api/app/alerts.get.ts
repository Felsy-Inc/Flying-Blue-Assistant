import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { listAlertsForUser } from '~~/server/utils/db/alerts'

export default defineEventHandler(async (event) => {
  const { userId, supabase } = await requireSupabaseSession(event)
  const alerts = await listAlertsForUser(supabase, userId)
  return { alerts }
})
