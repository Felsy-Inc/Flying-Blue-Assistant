import type { AuthError } from '@supabase/supabase-js'

/**
 * Map Supabase Auth errors to i18n keys (resolved with `t()` in UI).
 */
export function authErrorToKey(error: AuthError): string {
  const msg = (error.message || '').toLowerCase()
  const status = error.status

  if (msg.includes('invalid login credentials') || status === 400) {
    return 'auth.errors.invalidCredentials'
  }
  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'auth.errors.emailNotConfirmed'
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'auth.errors.userAlreadyRegistered'
  }
  if (msg.includes('password') && msg.includes('least')) {
    return 'auth.errors.passwordTooShort'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests') || status === 429) {
    return 'auth.errors.rateLimited'
  }
  if (msg.includes('invalid email')) {
    return 'auth.validation.emailInvalid'
  }
  return 'auth.errors.generic'
}
