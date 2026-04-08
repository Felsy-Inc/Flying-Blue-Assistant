import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from '~lib/i18n/locales'
import type { AlertEmailFields } from '~lib/email/alert-payload'
import type { Database } from '~~/types/database.types'

export type AlertMatchDispatchInput = {
  event: H3Event
  serviceClient: SupabaseClient<Database>
  userId: string
  toEmail: string
  locale: Locale
  alert: AlertEmailFields
}
