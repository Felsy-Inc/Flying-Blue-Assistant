import { serverSupabaseServiceRole } from '#supabase/server'
import { getHeader, readRawBody } from 'h3'
import type Stripe from 'stripe'
import { STRIPE_META_SUPABASE_USER_ID } from '~lib/billing/stripe-constants'
import { getStripe } from '~~/server/utils/stripe/get-stripe'
import {
  subscriptionIdFromCheckoutSession,
  subscriptionIdFromInvoice,
} from '~~/server/utils/stripe/map-subscription'
import { resolveStripeSecretKey } from '~~/server/utils/stripe/resolve-stripe-secret-key'
import { syncStripeSubscriptionToDb } from '~~/server/utils/stripe/subscription-sync'

/** Raw body is enforced via `nuxt.config` `routeRules['/api/stripe/webhook'].bodyParser = false`. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = config.stripeWebhookSecret?.trim()
  if (!secret) {
    throw createError({ statusCode: 503, statusMessage: 'stripe_webhook_not_configured' })
  }

  const stripeSecretKey = resolveStripeSecretKey(event)
  if (!stripeSecretKey) {
    throw createError({ statusCode: 503, statusMessage: 'stripe_secret_not_configured' })
  }
  const stripe = getStripe(stripeSecretKey)
  const signature = getHeader(event, 'stripe-signature')
  const payload = await readRawBody(event)
  if (!signature || payload === undefined || payload === '') {
    throw createError({ statusCode: 400, statusMessage: 'missing_signature_or_body' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(payload, signature, secret)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'invalid_stripe_signature' })
  }

  const serviceClient = serverSupabaseServiceRole(event)
  const expectedProPriceId = config.stripePriceProMonthly?.trim() || null

  async function syncSubscriptionFromInvoice(invoice: Stripe.Invoice) {
    const subId = subscriptionIdFromInvoice(invoice)
    if (!subId) return
    const sub = await stripe.subscriptions.retrieve(subId)
    await syncStripeSubscriptionToDb(serviceClient, sub, undefined, expectedProPriceId)
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const userId =
          session.metadata?.[STRIPE_META_SUPABASE_USER_ID] ??
          (typeof session.client_reference_id === 'string' ? session.client_reference_id : null)
        const subId = subscriptionIdFromCheckoutSession(session)
        if (!subId || !userId) {
          console.warn('[stripe] checkout.session.completed: missing subscription id or user', {
            sessionId: session.id,
            hasSubId: Boolean(subId),
            hasUserId: Boolean(userId),
          })
          break
        }

        const sub = await stripe.subscriptions.retrieve(subId)
        await syncStripeSubscriptionToDb(serviceClient, sub, userId, expectedProPriceId)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object as Stripe.Subscription
        await syncStripeSubscriptionToDb(serviceClient, sub, undefined, expectedProPriceId)
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        await syncSubscriptionFromInvoice(invoice)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[stripe] webhook handler error', stripeEvent.type, err)
    throw createError({ statusCode: 500, statusMessage: 'webhook_processing_failed' })
  }

  return { received: true }
})
