import Stripe from 'stripe'

const clients = new Map<string, Stripe>()

export function getStripe(secretKey: string | undefined): Stripe {
  const trimmed = secretKey?.trim()
  if (!trimmed) {
    throw new Error('stripe_not_configured')
  }
  let client = clients.get(trimmed)
  if (!client) {
    client = new Stripe(trimmed)
    clients.set(trimmed, client)
  }
  return client
}
