# Architecture overview

Flying Blue Assistant is a **Nuxt 4** full-stack app: Vue UI under `app/`, shared domain logic under `lib/`, and Nitro API routes under `server/api/`. Data lives in **Supabase** (Postgres + Auth + RLS). Optional **Stripe** handles subscriptions; **Resend** sends transactional email.

## Layers

| Layer | Role |
|--------|------|
| `app/pages`, `app/layouts`, `app/components` | Routes, layouts, FBA-prefixed UI (`Fba*`). |
| `app/composables` | Client state: auth wrapper, locale, app overview. |
| `lib/` | Schemas (Zod), i18n messages, availability domain, billing helpers — imported as `~lib/...`. |
| `lib/availability/` | Provider-agnostic award search types, mock provider, scoring, mappers — see [lib/availability/README.md](../lib/availability/README.md). |
| `server/api/` | HTTP handlers: `/api/app/*` (authenticated app), `/api/billing/*`, `/api/cron/*`, webhooks. |
| `server/utils/` | DB access, billing resolution, notification dispatch, validation helpers. |
| `supabase/migrations/` | Schema source of truth; apply to your project then regenerate `types/database.types.ts`. |

## Request flow (examples)

1. **Award search** — `POST /api/app/search` uses `requireSupabaseSession`, validates with `availabilitySearchBodySchema`, checks daily quota (`usage-limits`), calls `resolveAvailabilityProvider` (currently mock when `USE_MOCK_PROVIDER` is true), logs usage/search where tables exist.
2. **Alerts** — `POST/PATCH/DELETE /api/app/alerts` validate with `alertUpsertBodySchema` / merge + full validate on PATCH. Active-alert limits enforced before activate.
3. **Overview** — `GET /api/app/overview` aggregates plan, usage, billing flags for the dashboard.
4. **Cron** — `GET /api/cron/process-alerts` (Bearer `CRON_SECRET`) runs scheduled alert checks; notifications go through `dispatch-alert-match` (email via Resend when enabled).

## Auth

- **@nuxtjs/supabase** is enabled only when `SUPABASE_URL` + anon key are set (see `.env.example`).
- Server routes that need a user call `requireSupabaseSession` (or equivalent) and use the user-scoped Supabase client (RLS applies).
- Service-role client is **server-only** for workers, cache, webhooks, and cross-user jobs.

## Configuration flags

Runtime config (see `nuxt.config` and `.env.example`) toggles mock provider, email sending, public browse, and billing UI. **Billing** requires Stripe secrets plus `BILLING_ENABLED` / `NUXT_PUBLIC_BILLING_ENABLED` alignment for server vs client.

## Type safety

- Generated **`types/database.types.ts`** for Supabase rows.
- **Zod** at API boundaries; failed parses map to `400` with `statusMessage: 'validation_failed'` and `data.fieldErrors` for forms.

## i18n

App copy is in **`lib/i18n/messages/{en,nl,fr}.ts`**. Locale is driven by `useAppLocale()` (cookie + `Accept-Language`), separate from Nuxt UI locale.

## Deployment (Vercel)

Nitro preset switches to **vercel** when the `VERCEL` env is set. Set production env vars to match `.env.example`, configure Supabase redirect URLs to your domain, Stripe webhook URL to `/api/billing/webhook` (or your mounted path), and cron to hit the process-alerts route with `CRON_SECRET`.
