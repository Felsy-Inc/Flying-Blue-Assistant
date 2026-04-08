import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

declare module '#app' {
  interface NuxtApp {
    /** Present when `@nuxtjs/supabase` is enabled and configured. */
    $supabase?: {
      client: SupabaseClient<Database>
    }
  }
}

export type { Database }

export {}
