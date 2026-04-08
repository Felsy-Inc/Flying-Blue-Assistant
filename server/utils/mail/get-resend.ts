import { Resend } from 'resend'

const byKey = new Map<string, Resend>()

export function getResendForKey(apiKey: string): Resend {
  let c = byKey.get(apiKey)
  if (!c) {
    c = new Resend(apiKey)
    byKey.set(apiKey, c)
  }
  return c
}
