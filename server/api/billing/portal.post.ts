import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { isBillingEnabled } from '~~/server/utils/billing/is-billing-enabled'
import { getSubscriptionForUser } from '~~/server/utils/db/subscriptions'
import { getStripe } from '~~/server/utils/stripe/get-stripe'
import { resolveStripeSecretKey } from '~~/server/utils/stripe/resolve-stripe-secret-key'
import { throwIfStripeAuthError } from '~~/server/utils/stripe/stripe-api-errors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!isBillingEnabled(event)) {
    throw createError({ statusCode: 404, statusMessage: 'billing_disabled' })
  }
  const stripeSecretKey = resolveStripeSecretKey(event)
  if (!stripeSecretKey) {
    throw createError({ statusCode: 503, statusMessage: 'stripe_secret_not_configured' })
  }

  const { userId, supabase } = await requireSupabaseSession(event)
  const row = await getSubscriptionForUser(supabase, userId)
  if (!row?.stripe_customer_id) {
    throw createError({ statusCode: 400, statusMessage: 'no_stripe_customer' })
  }

  const stripe = getStripe(stripeSecretKey)
  const appUrl = String(config.public.appUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  let session: { url: string }
  try {
    session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${appUrl}/app/account`,
    })
  } catch (e) {
    throwIfStripeAuthError(e)
    throw e
  }

  if (!session.url) {
    throw createError({ statusCode: 500, statusMessage: 'portal_session_missing_url' })
  }

  return { url: session.url }
})
