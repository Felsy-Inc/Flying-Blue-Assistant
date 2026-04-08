import type { Session } from '@supabase/supabase-js'

/**
 * Same `useState` key as `@nuxtjs/supabase` (`supabase_session`), so marketing shell
 * and auth helpers stay in sync when the module is enabled — without requiring the
 * module’s auto-import when it is disabled (e.g. CI without env).
 */
export const useSessionState = () => useState<Session | null>('supabase_session', () => null)
