import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { STRIPE_META_SUPABASE_USER_ID } from '~lib/billing/stripe-constants'
import { upsertSubscriptionAndProfilePlan } from '~~/server/utils/db/subscriptions'
import { resolveSubscriptionPlanTier, stripeStatusToDb } from '~~/server/utils/stripe/map-subscription'
import type { Database } from '~~/types/database.types'

function customerIdFromStripe(sub: Stripe.Subscription): string | null {
  const c = sub.customer
  if (typeof c === 'string') return c
  return c?.id ?? null
}

export async function syncStripeSubscriptionToDb(
  serviceClient: SupabaseClient<Database>,
  stripeSubscription: Stripe.Subscription,
  explicitUserId?: string | null,
  expectedProPriceId?: string | null,
): Promise<void> {
  const meta = stripeSubscription.metadata ?? {}
  let userId = (explicitUserId ?? meta[STRIPE_META_SUPABASE_USER_ID])?.trim() || null

  const customerId = customerIdFromStripe(stripeSubscription)
  if (!customerId) {
    console.warn('[stripe] sync: missing customer id', stripeSubscription.id)
    return
  }

  if (!userId) {
    const { data } = await serviceClient
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    userId = data?.user_id ?? null
  }

  if (!userId) {
    console.warn('[stripe] sync: could not resolve user', stripeSubscription.id, customerId)
    return
  }

  const dbStatus = stripeStatusToDb(stripeSubscription.status)
  const planTier = resolveSubscriptionPlanTier(stripeSubscription, expectedProPriceId)
  const cps = stripeSubscription.current_period_start
  const cpe = stripeSubscription.current_period_end

  await upsertSubscriptionAndProfilePlan(serviceClient, {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: stripeSubscription.id,
    status: dbStatus,
    planTier,
    currentPeriodStart: cps ? new Date(cps * 1000).toISOString() : null,
    currentPeriodEnd: cpe ? new Date(cpe * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
  })
}
