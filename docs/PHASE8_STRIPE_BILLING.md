# Phase 8 — Stripe Pro (monthly)

## What was added

- **Checkout** — `POST /api/billing/checkout` creates a Stripe Checkout Session (mode `subscription`) for the Pro **monthly** price. Success URL includes `session_id={CHECKOUT_SESSION_ID}` so the app can sync immediately. Requires session + `BILLING_ENABLED=true` + `STRIPE_PRICE_PRO_MONTHLY`.
- **Post-checkout sync** — `POST /api/billing/sync-checkout` (body `{ "sessionId" }`) verifies the session belongs to the signed-in user and writes subscription + `profiles.plan_tier` (covers **local dev** when webhooks are not forwarded; production still relies on webhooks as source of truth).
- **Customer portal** — `POST /api/billing/portal` opens the Stripe Billing Portal when the user already has `stripe_customer_id` in `public.subscriptions`.
- **Webhooks** — `POST /api/stripe/webhook` (raw body) verifies `Stripe-Signature` and syncs:
  - `checkout.session.completed`
  - `customer.subscription.created` / `updated` / `deleted`
  - `invoice.paid` / `invoice.payment_failed` (subscription invoices → re-fetch subscription and sync)
- **DB** — migration enforces **one row per user** on `public.subscriptions` and extends `status` for Stripe (`incomplete_expired`, `paused`). Webhook handler upserts `subscriptions` and updates **`profiles.plan_tier`** (same source of truth as quotas via `getUserPlanContext`).
- **UI** — `/pricing` upgrade CTA when billing is enabled; `/app/account` shows plan, subscription status, period end, **Manage billing**, and upgrade link for Free users.

Yearly billing is **not** implemented; add a second price env + optional checkout body/price selection later without schema changes.

## Stripe Dashboard checklist

1. **Product** “Pro” (or your name) with **recurring monthly** price → copy **Price ID** (`price_...`) into `STRIPE_PRICE_PRO_MONTHLY`.
2. **Customer portal** — enable in Stripe Dashboard (Billing → Customer portal) so `/api/billing/portal` works.
3. **Webhook endpoint** — URL: `{NUXT_PUBLIC_APP_URL}/api/stripe/webhook` (production: your deployed origin).
4. **Webhook events** — subscribe at minimum to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the endpoint **signing secret** into `STRIPE_WEBHOOK_SECRET`.

Use **test mode** keys until you are ready for live.

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `STRIPE_SECRET_KEY` | Server | Stripe **Secret key**, volledig (geen `...`). Lokaal: **Test mode** `sk_test_...` uit Developers → API keys. Live key alleen als dashboard + prijzen ook live zijn. |
| `STRIPE_WEBHOOK_SECRET` | Server | Webhook signature (`whsec_...`) |
| `STRIPE_PRICE_PRO_MONTHLY` | Server | Monthly Pro price id (`price_...`) |
| `BILLING_ENABLED` or `NUXT_PUBLIC_BILLING_ENABLED` | Server + public | `true` / `1` / `yes` — checkout, portal, pricing/account CTAs (`nuxt.config` + Nitro load these via `env/load-dotenv` + `server/plugins/00-project-dotenv.server.ts`) |
| `NUXT_PUBLIC_APP_URL` | Public | Success/cancel/portal return URLs |
| `SUPABASE_KEY` | Server | Supabase secret (service role) — webhooks and `auth.admin.getUserById` on checkout |

**Billing flag wiring:** `runtimeConfig.public.billingEnabled` is set in `nuxt.config.ts`. API routes use `isBillingEnabled()` (`server/utils/billing/is-billing-enabled.ts`), which also reads `process.env` after the Nitro plugin applies `.env` from the project root (bundled code must not rely on `import.meta.url` inside `load-dotenv` for the repo path). Restart dev after changing `.env`. If checkout still returns `billing_disabled`, check `.env.local` does not set billing to `false`.

## Metadata contract

Checkout sets Stripe metadata key **`supabase_user_id`** on the session and on `subscription_data.metadata` (see `lib/billing/stripe-constants.ts`). Do not remove this in Dashboard automation.

## Exact next prompt — Phase 9 only

> **Phase 9 only:** Implement the production **alert match notification** pipeline: when `alert_matches` are created, enqueue or send email via Resend with deduplication, respect user/plan and `EMAILS_ENABLED`, add minimal retry/logging, and document operational runbooks — **do not change Stripe billing or subscription sync.**
