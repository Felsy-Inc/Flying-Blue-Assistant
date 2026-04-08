import { z } from 'zod'
import type { AlertRow } from '~lib/alerts/alert-schema'
import { locales, type Locale } from '~lib/i18n/locales'
import { alertRowToEmailFields, sampleAlertEmailFields } from '~lib/email/alert-payload'
import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { getAlertByIdForUser, listAlertsForUser } from '~~/server/utils/db/alerts'
import { sendAlertEmail } from '~~/server/utils/mail/send-alert-email'

const localeEnum = z.enum(locales)

const bodySchema = z.object({
  alertId: z.string().uuid().optional(),
  locale: z.string().optional(),
  /** Dev / explicit override only — see `recipientOverrideAllowed`. */
  to: z.string().email().optional(),
})

function recipientOverrideAllowed(): boolean {
  if (import.meta.dev) return true
  return process.env.EMAIL_TEST_ALLOW_TO_OVERRIDE === 'true'
}

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_body' })
  }

  const { userId, supabase } = await requireSupabaseSession(event)

  const body = parsed.data
  if (body.to && !recipientOverrideAllowed()) {
    throw createError({ statusCode: 403, statusMessage: 'to_override_not_allowed' })
  }

  let locale: Locale = 'en'
  if (body.locale !== undefined) {
    const l = localeEnum.safeParse(body.locale)
    if (!l.success) {
      throw createError({ statusCode: 400, statusMessage: 'invalid_locale' })
    }
    locale = l.data
  }

  let isSample = false
  let fields = sampleAlertEmailFields()

  if (body.alertId) {
    const row = await getAlertByIdForUser(supabase, body.alertId, userId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'alert_not_found' })
    }
    fields = alertRowToEmailFields(row as AlertRow)
  } else {
    const list = await listAlertsForUser(supabase, userId)
    if (list.length > 0) {
      fields = alertRowToEmailFields(list[0] as AlertRow)
    } else {
      isSample = true
    }
  }

  const { data: sessionUser, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw userErr
  const defaultTo = sessionUser.user?.email?.trim()
  if (!defaultTo) {
    throw createError({ statusCode: 400, statusMessage: 'user_email_missing' })
  }

  const to = body.to ?? defaultTo

  const result = await sendAlertEmail({
    event,
    supabase,
    userId,
    to,
    locale,
    alert: fields,
    isSample,
    kind: 'alert_test',
  })

  return {
    ok: result.status === 'sent' || result.status === 'skipped',
    status: result.status,
    messageId: result.messageId,
    reason: result.reason,
    locale,
    usedSample: isSample,
    alertId: fields.id,
  }
})
