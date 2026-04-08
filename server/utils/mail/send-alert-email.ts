import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from '~lib/i18n/locales'
import type { TransactionalEmailKind } from '~lib/email/types'
import type { AlertEmailFields } from '~lib/email/alert-payload'
import type { Database } from '~~/types/database.types'
import { insertEmailSendLog } from '~~/server/utils/db/email-send-logs'
import { renderAlertEmail } from './render-alert-email'
import { sendWithResend } from './mailer'

export type SendAlertEmailInput = {
  event: H3Event
  supabase: SupabaseClient<Database>
  userId: string
  to: string
  locale: Locale
  alert: AlertEmailFields
  isSample: boolean
  /** Cron match notification vs manual test / static summary. */
  isMatch?: boolean
  kind: TransactionalEmailKind
}

export async function sendAlertEmail(input: SendAlertEmailInput): Promise<{
  status: 'sent' | 'skipped' | 'failed'
  messageId?: string
  reason?: string
}> {
  const config = useRuntimeConfig(input.event)
  const appUrl =
    typeof config.public.appUrl === 'string' && config.public.appUrl.length > 0
      ? config.public.appUrl
      : 'http://localhost:3000'
  const emailsEnabled = Boolean(config.public.featureFlags?.emailsEnabled)
  const resendApiKey = typeof config.resendApiKey === 'string' ? config.resendApiKey : ''
  const emailFrom = typeof config.emailFrom === 'string' ? config.emailFrom : ''

  const rendered = renderAlertEmail(input.locale, input.alert, appUrl, {
    isSample: input.isSample,
    isMatch: input.isMatch,
  })

  const log = async (
    status: 'skipped' | 'sent' | 'failed',
    extra?: { messageId?: string; error?: string },
  ) => {
    await insertEmailSendLog(input.supabase, {
      user_id: input.userId,
      email_type: input.kind,
      to_email: input.to,
      status,
      provider_message_id: extra?.messageId ?? null,
      error_message: extra?.error ?? null,
      metadata: {
        alert_id: input.alert.id,
        locale: input.locale,
        is_sample: input.isSample,
        is_match: input.isMatch ?? false,
      },
    })
  }

  if (!emailsEnabled) {
    await log('skipped', { error: 'emails_disabled' })
    return { status: 'skipped', reason: 'emails_disabled' }
  }

  if (!resendApiKey || !emailFrom.trim()) {
    await log('skipped', { error: 'resend_not_configured' })
    return { status: 'skipped', reason: 'resend_not_configured' }
  }

  const result = await sendWithResend(resendApiKey, {
    from: emailFrom,
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [{ name: 'kind', value: input.kind }],
  })

  if ('error' in result) {
    await log('failed', { error: result.error })
    return { status: 'failed', reason: result.error }
  }

  await log('sent', { messageId: result.messageId })
  return { status: 'sent', messageId: result.messageId }
}
