import Stripe from 'stripe'

/** Maps Stripe auth failures to a safe HTTP error (no secret echoed to client). */
export function throwIfStripeAuthError(e: unknown): void {
  if (e instanceof Stripe.errors.StripeAuthenticationError) {
    console.error('[stripe] STRIPE_SECRET_KEY rejected by Stripe (invalid, revoked, or wrong mode)')
    throw createError({ statusCode: 503, statusMessage: 'stripe_invalid_secret' })
  }
}
