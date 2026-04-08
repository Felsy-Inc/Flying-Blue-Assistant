import { serverSupabaseServiceRole } from '#supabase/server'
import { STRIPE_META_SUPABASE_USER_ID } from '~lib/billing/stripe-constants'
import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { getSubscriptionForUser } from '~~/server/utils/db/subscriptions'
import { isBillingEnabled } from '~~/server/utils/billing/is-billing-enabled'
import { getStripe } from '~~/server/utils/stripe/get-stripe'
import { resolveStripeSecretKey } from '~~/server/utils/stripe/resolve-stripe-secret-key'
import { throwIfStripeAuthError } from '~~/server/utils/stripe/stripe-api-errors'

const ACTIVE_LIKE = new Set(['active', 'trialing', 'past_due'])

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!isBillingEnabled(event)) {
    throw createError({ statusCode: 404, statusMessage: 'billing_disabled' })
  }

  const priceId = config.stripePriceProMonthly
  if (!priceId) {
    throw createError({ statusCode: 503, statusMessage: 'stripe_price_not_configured' })
  }
  const stripeSecretKey = resolveStripeSecretKey(event)
  if (!stripeSecretKey) {
    throw createError({ statusCode: 503, statusMessage: 'stripe_secret_not_configured' })
  }

  const { userId, supabase } = await requireSupabaseSession(event)

  const existing = await getSubscriptionForUser(supabase, userId)
  if (
    existing?.plan_tier === 'pro' &&
    existing.status &&
    ACTIVE_LIKE.has(existing.status)
  ) {
    throw createError({ statusCode: 409, statusMessage: 'already_subscribed' })
  }

  const stripe = getStripe(stripeSecretKey)
  const admin = serverSupabaseServiceRole(event)
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId)
  if (userErr) throw userErr

  const email = userData.user?.email ?? undefined
  if (!existing?.stripe_customer_id && !email?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'checkout_requires_email_or_customer' })
  }

  const appUrl = String(config.public.appUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  let session: { url: string | null }
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
      client_reference_id: userId,
      metadata: { [STRIPE_META_SUPABASE_USER_ID]: userId },
      subscription_data: {
        metadata: { [STRIPE_META_SUPABASE_USER_ID]: userId },
      },
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : email
          ? { customer_email: email }
          : {}),
    })
  } catch (e) {
    throwIfStripeAuthError(e)
    throw e
  }

  if (!session.url) {
    throw createError({ statusCode: 500, statusMessage: 'checkout_session_missing_url' })
  }

  return { url: session.url }
})
