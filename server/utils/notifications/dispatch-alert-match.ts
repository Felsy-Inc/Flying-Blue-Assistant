import { sendAlertEmail } from '~~/server/utils/mail/send-alert-email'
import { dispatchPushAlertMatch } from './push-stub'
import type { AlertMatchDispatchInput } from './types'

/**
 * v1: email only. Add `dispatchPushAlertMatch` here when mobile/web push exists.
 */
export async function dispatchAlertMatchNotifications(
  input: AlertMatchDispatchInput,
): Promise<{ email: { status: 'sent' | 'skipped' | 'failed'; reason?: string } }> {
  const result = await sendAlertEmail({
    event: input.event,
    supabase: input.serviceClient,
    userId: input.userId,
    to: input.toEmail,
    locale: input.locale,
    alert: input.alert,
    isSample: false,
    isMatch: true,
    kind: 'alert_match',
  })

  if (result.status === 'sent') {
    await dispatchPushAlertMatch(input)
  }

  return { email: { status: result.status, reason: result.reason } }
}
