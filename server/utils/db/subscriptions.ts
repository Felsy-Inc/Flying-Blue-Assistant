import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, PlanTier } from '~~/types/database.types'
import type { SubscriptionDbStatus } from '~~/server/utils/stripe/map-subscription'
import { ensureProfileForUser } from '~~/server/utils/db/profiles'
import { isMissingDbObjectError } from './supabase-errors'

type SubRow = Database['public']['Tables']['subscriptions']['Row']

export async function getSubscriptionForUser(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<SubRow | null> {
  const { data, error } = await client
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingDbObjectError(error)) return null
    throw error
  }
  return (data ?? null) as SubRow | null
}

/** Webhook / billing admin: upsert by `user_id` and mirror tier to `profiles`. */
export async function upsertSubscriptionAndProfilePlan(
  serviceClient: SupabaseClient<Database>,
  args: {
    userId: string
    stripeCustomerId: string
    stripeSubscriptionId: string | null
    status: SubscriptionDbStatus
    planTier: PlanTier
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  },
): Promise<void> {
  await ensureProfileForUser(serviceClient, args.userId)

  const row: Database['public']['Tables']['subscriptions']['Insert'] = {
    user_id: args.userId,
    stripe_customer_id: args.stripeCustomerId,
    stripe_subscription_id: args.stripeSubscriptionId,
    status: args.status,
    plan_tier: args.planTier,
    current_period_start: args.currentPeriodStart,
    current_period_end: args.currentPeriodEnd,
    cancel_at_period_end: args.cancelAtPeriodEnd,
  }

  const { error: subErr } = await serviceClient.from('subscriptions').upsert(row, { onConflict: 'user_id' })
  if (subErr) throw subErr

  const { error: profErr } = await serviceClient
    .from('profiles')
    .update({ plan_tier: args.planTier })
    .eq('id', args.userId)
  if (profErr) throw profErr
}
