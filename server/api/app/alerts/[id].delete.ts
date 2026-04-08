import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { deleteAlertForUser, getAlertByIdForUser } from '~~/server/utils/db/alerts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_alert_id' })
  }

  const { userId, supabase } = await requireSupabaseSession(event)

  const existing = await getAlertByIdForUser(supabase, id, userId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'alert_not_found' })
  }

  await deleteAlertForUser(supabase, id, userId)
  return { ok: true }
})
