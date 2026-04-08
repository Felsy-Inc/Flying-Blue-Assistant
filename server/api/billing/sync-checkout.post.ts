import { serverSupabaseServiceRole } from '#supabase/server'
import { readBody } from 'h3'
import { STRIPE_META_SUPABASE_USER_ID } from '~lib/billing/stripe-constants'
import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { isBillingEnabled } from '~~/server/utils/billing/is-billing-enabled'
import { getStripe } from '~~/server/utils/stripe/get-stripe'
import { subscriptionIdFromCheckoutSession } from '~~/server/utils/stripe/map-subscription'
import { resolveStripeSecretKey } from '~~/server/utils/stripe/resolve-stripe-secret-key'
import { syncStripeSubscriptionToDb } from '~~/server/utils/stripe/subscription-sync'
import { throwIfStripeAuthError } from '~~/server/utils/stripe/stripe-api-errors'
import type Stripe from 'stripe'

/**
 * Client callback after Checkout success (esp. local dev without Stripe webhook forwarding).
 * Verifies the session belongs to the signed-in user, then syncs subscription → DB + profile.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!isBillingEnabled(event)) {
    throw createError({ statusCode: 404, statusMessage: 'billing_disabled' })
  }
  const stripeSecretKey = resolveStripeSecretKey(event)
  if (!stripeSecretKey) {
    throw createError({ statusCode: 503, statusMessage: 'stripe_secret_not_configured' })
  }

  const { userId } = await requireSupabaseSession(event)
  const body = await readBody<{ sessionId?: string }>(event)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''
  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'session_id_required' })
  }

  const stripe = getStripe(stripeSecretKey)
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })
  } catch (e) {
    throwIfStripeAuthError(e)
    throw createError({ statusCode: 400, statusMessage: 'checkout_session_not_found' })
  }

  const metaUser =
    session.metadata?.[STRIPE_META_SUPABASE_USER_ID] ??
    (typeof session.client_reference_id === 'string' ? session.client_reference_id : null)
  if (metaUser !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'checkout_session_forbidden' })
  }

  const subId = subscriptionIdFromCheckoutSession(session)
  if (!subId) {
    throw createError({ statusCode: 400, statusMessage: 'checkout_no_subscription' })
  }

  const expanded = session.subscription
  const sub: Stripe.Subscription =
    expanded && typeof expanded === 'object' && 'status' in expanded
      ? (expanded as Stripe.Subscription)
      : await stripe.subscriptions.retrieve(subId)

  const serviceClient = serverSupabaseServiceRole(event)
  const expectedProPriceId = config.stripePriceProMonthly?.trim() || null
  await syncStripeSubscriptionToDb(serviceClient, sub, userId, expectedProPriceId)

  return { ok: true as const }
})
