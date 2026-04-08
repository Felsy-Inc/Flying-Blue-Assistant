import { getResendForKey } from './get-resend'

export type MailerPayload = {
  from: string
  to: string
  subject: string
  html: string
  text?: string
  tags?: { name: string; value: string }[]
}

export async function sendWithResend(
  apiKey: string,
  payload: MailerPayload,
): Promise<{ messageId: string } | { error: string }> {
  const resend = getResendForKey(apiKey)
  const { data, error } = await resend.emails.send({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    tags: payload.tags,
  })

  if (error) {
    const msg =
      typeof error === 'object' && error && 'message' in error && typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'resend_error'
    return { error: msg }
  }

  if (!data?.id) return { error: 'resend_missing_id' }
  return { messageId: data.id }
}
