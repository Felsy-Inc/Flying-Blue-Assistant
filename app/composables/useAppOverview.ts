import type { AlertRow } from '~lib/alerts/alert-schema'

export type AppOverviewPayload = {
  planTier: string
  planLimits: {
    max_searches_per_day: number
    max_active_alerts: number
  }
  billing: {
    subscriptionStatus: string
    hasStripeCustomer: boolean
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    proPriceMismatch: boolean
  }
  usage: {
    searchesToday: number
    searchesLimit: number
    activeAlertCount: number
    activeAlertsLimit: number
    searchQuotaExhausted: boolean
    activeAlertQuotaExhausted: boolean
  }
  alertsPreview: AlertRow[]
  recentMatches: unknown[]
}

/** Shared `/api/app/overview` fetch (deduped via key) for dashboard, search, alerts. */
export function useAppOverview() {
  return useFetch<AppOverviewPayload>('/api/app/overview', {
    key: 'app-overview',
    default: () => ({
      planTier: 'free',
      planLimits: { max_searches_per_day: 3, max_active_alerts: 1 },
      billing: {
        subscriptionStatus: 'none',
        hasStripeCustomer: false,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        proPriceMismatch: false,
      },
      usage: {
        searchesToday: 0,
        searchesLimit: 3,
        activeAlertCount: 0,
        activeAlertsLimit: 1,
        searchQuotaExhausted: false,
        activeAlertQuotaExhausted: false,
      },
      alertsPreview: [],
      recentMatches: [],
    }),
  })
}
