import { UsageEventType } from '~lib/billing/usage-events'
import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { getUserPlanContext } from '~~/server/utils/billing/user-plan'
import { listAlertsForUser } from '~~/server/utils/db/alerts'
import { getSubscriptionForUser } from '~~/server/utils/db/subscriptions'
import { countUsageEventsForUtcDay } from '~~/server/utils/db/usage'

export default defineEventHandler(async (event) => {
  const { userId, supabase } = await requireSupabaseSession(event)

  const { planTier, limits } = await getUserPlanContext(supabase, userId)
  const subscriptionRow = await getSubscriptionForUser(supabase, userId)
  const dayUtc = new Date().toISOString().slice(0, 10)
  const searchesToday = await countUsageEventsForUtcDay(supabase, userId, UsageEventType.searchExecuted, dayUtc)

  const allAlerts = await listAlertsForUser(supabase, userId)
  const activeAlerts = allAlerts.filter((a) => a.status === 'active')

  const searchesLimit = limits.max_searches_per_day
  const activeAlertsLimit = limits.max_active_alerts

  const stripeStatusGrantsPro = new Set(['active', 'trialing', 'past_due'])
  const proPriceMismatch = Boolean(
    subscriptionRow?.stripe_subscription_id &&
      subscriptionRow.plan_tier === 'free' &&
      subscriptionRow.status &&
      stripeStatusGrantsPro.has(subscriptionRow.status),
  )

  return {
    planTier,
    planLimits: limits,
    billing: {
      subscriptionStatus: subscriptionRow?.status ?? 'none',
      hasStripeCustomer: Boolean(subscriptionRow?.stripe_customer_id),
      currentPeriodEnd: subscriptionRow?.current_period_end ?? null,
      cancelAtPeriodEnd: subscriptionRow?.cancel_at_period_end ?? false,
      proPriceMismatch,
    },
    usage: {
      searchesToday,
      searchesLimit,
      activeAlertCount: activeAlerts.length,
      activeAlertsLimit,
      searchQuotaExhausted: searchesToday >= searchesLimit,
      activeAlertQuotaExhausted: activeAlerts.length >= activeAlertsLimit,
    },
    alertsPreview: activeAlerts.slice(0, 5),
    /** Phase 8+: join `alert_matches` */
    recentMatches: [] as unknown[],
  }
})
