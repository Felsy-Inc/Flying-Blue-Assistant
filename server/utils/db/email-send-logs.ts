import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'
import { isMissingDbObjectError } from './supabase-errors'

export async function insertEmailSendLog(
  client: SupabaseClient<Database>,
  row: Database['public']['Tables']['email_send_logs']['Insert'],
): Promise<void> {
  const { error } = await client.from('email_send_logs').insert(row)
  if (error) {
    if (isMissingDbObjectError(error)) return
    console.error('[email_send_logs]', error.message)
  }
}
