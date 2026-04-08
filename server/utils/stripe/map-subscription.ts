import type Stripe from 'stripe'
import type { PlanTier } from '~~/types/database.types'

function priceIdFromStripePrice(price: string | Stripe.Price | Stripe.DeletedPrice | null | undefined): string | null {
  if (typeof price === 'string') return price
  if (price && typeof price === 'object' && 'id' in price && typeof price.id === 'string') return price.id
  return null
}

/** True if any subscription line item uses `priceId` (guards Pro entitlements when multiple products exist). */
export function subscriptionIncludesPriceId(subscription: Stripe.Subscription, priceId: string): boolean {
  const want = priceId.trim()
  if (!want) return false
  for (const item of subscription.items?.data ?? []) {
    const id = priceIdFromStripePrice(item.price)
    if (id === want) return true
  }
  return false
}

/** DB `subscriptions.status` values (matches Phase 8 migration check). */
export type SubscriptionDbStatus =
  | 'none'
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

export function stripeStatusToDb(status: Stripe.Subscription.Status): SubscriptionDbStatus {
  switch (status) {
    case 'active':
    case 'canceled':
    case 'past_due':
    case 'trialing':
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
      return status
    default:
      return 'canceled'
  }
}

/**
 * Effective app tier for quotas/UI. Past_due still has service until Stripe finalizes cancel.
 * Paused / incomplete / unpaid / canceled → free.
 */
export function stripeSubscriptionToPlanTier(status: Stripe.Subscription.Status): PlanTier {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return 'pro'
    default:
      return 'free'
  }
}

/**
 * Effective tier: Stripe status first, then optional check that the subscription includes the configured Pro price.
 * If `expectedProPriceId` is set and no line matches, returns `free` even when Stripe status is active-like.
 */
export function resolveSubscriptionPlanTier(
  subscription: Stripe.Subscription,
  expectedProPriceId: string | null | undefined,
): PlanTier {
  const fromStatus = stripeSubscriptionToPlanTier(subscription.status)
  if (fromStatus !== 'pro') return fromStatus
  const expected = expectedProPriceId?.trim()
  if (!expected) return 'pro'
  if (subscriptionIncludesPriceId(subscription, expected)) return 'pro'
  console.warn('[stripe] subscription status grants Pro but no line item matches STRIPE_PRICE_PRO_MONTHLY; tier free', {
    subscriptionId: subscription.id,
    expectedPriceId: expected,
  })
  return 'free'
}

/** Checkout sessions may return `subscription` as an id string or an expanded object. */
export function subscriptionIdFromCheckoutSession(session: Stripe.Checkout.Session): string | null {
  const sub = session.subscription
  if (typeof sub === 'string' && sub.length > 0) return sub
  if (sub && typeof sub === 'object' && 'id' in sub && typeof sub.id === 'string') return sub.id
  return null
}

/**
 * Subscription id on invoices: newer API versions use `parent.subscription_details.subscription`;
 * older payloads may expose top-level `subscription`.
 */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription
  if (typeof fromParent === 'string' && fromParent.length > 0) return fromParent
  if (fromParent && typeof fromParent === 'object' && 'id' in fromParent && typeof fromParent.id === 'string') {
    return fromParent.id
  }

  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription
  if (typeof legacy === 'string' && legacy.length > 0) return legacy
  if (legacy && typeof legacy === 'object' && 'id' in legacy && typeof legacy.id === 'string') return legacy.id

  return null
}
