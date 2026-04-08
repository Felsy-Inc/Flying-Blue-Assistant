# Phase 4 — Database schema & Supabase integration

## STEP 1 — Architecture review

### Current state (before Phase 4 implementation)

- **Nuxt 4** app with `@nuxtjs/supabase` gated by `SUPABASE_URL` + `SUPABASE_KEY` (publishable/anon).
- **No ORM**: Postgres is accessed via Supabase JS (`useSupabaseClient`, `serverSupabaseClient`, `serverSupabaseServiceRole`).
- **Auth**: Magic link / email-password; `/app/**` session-gated. Users live in `auth.users`.
- **Award UI**: Mock data only (`lib/awards/mock-flights.ts`); no persisted searches or alerts yet.

### Schema strategy

1. **`loyalty_programs` as a dimension** — MVP seeds `flying_blue`. New programs = new rows + app logic; all program-scoped tables reference `slug`.
2. **`plan_limits` as entitlement source of truth** — Rows for `free` / `pro` with numeric caps. Enforcement stays in **application code** for Phase 4 (simple, observable); optional DB hardening later.
3. **`profiles.plan_tier` denormalized** — Fast reads for UI/quotas; Stripe sync (Phase 5+) updates via **service role**. Trigger blocks authenticated users from changing `plan_tier` themselves.
4. **Append-only `usage_events`** — `event_type` + UTC-day counting for search limits; extensible metadata JSON.
5. **`availability_cache_entries`** — Shared fingerprint cache; **no grants** to `authenticated`; **service role** only (RLS enabled, no user policies).
6. **`alert_matches`** — Users **SELECT** via parent `alerts`; **INSERT** intended for workers using service role.
7. **Subscriptions table** — Columns for Stripe IDs/status; **no sync logic** in Phase 4.

### Files created or updated

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260320140000_phase4_initial_schema.sql` | Tables, seeds, RLS, grants, triggers |
| `supabase/README.md` | How to apply migrations |
| `types/database.types.ts` | Hand-written `Database` type for Supabase client |
| `types/supabase.d.ts` | `SupabaseClient<Database>` on `$supabase.client` |
| `lib/billing/usage-events.ts` | Canonical `event_type` string constants |
| `server/utils/db/*.ts` | Small repositories + quota helpers |
| `.env.example` | `SUPABASE_SECRET_KEY` documented |
| `README.md` | Phase 4 pointer |
| `docs/PHASE4_SCHEMA.md` | This document |

---

## STEP 2 — Entity design (summary)

- **profiles** — `id` = `auth.users.id`, display name, `default_loyalty_program_slug`, `plan_tier`, timezone.
- **subscriptions** — Stripe + period fields; links to `user_id`.
- **usage_events** — Per-user events (`search_executed`, etc.) with optional `loyalty_program_slug`.
- **search_logs** — Richer search analytics (params, duration, result count).
- **saved_searches** — Named saved criteria (`params` JSON).
- **alerts** — Route, trip type, outbound/return dates or ranges, cabin, passengers, optional max miles/taxes, `direct_only`, `active`/`paused`, optional scheduling fields.
- **alert_matches** — Match rows referencing optional `availability_cache_entries`.
- **availability_cache_entries** — `(loyalty_program_slug, fingerprint)` unique; `payload` + `expires_at`.

---

## STEP 3 — SQL, RLS, assumptions

- **Assumption**: IATA airports stored as **3-character uppercase** in app layer; DB checks `char_length = 3`.
- **Assumption**: Taxes stored as `numeric(12,2)` + currency (default `EUR`); miles as integer.
- **Assumption**: UTC for usage counting; helpers use explicit UTC day bounds.
- **RLS**: `loyalty_programs` + `plan_limits` **SELECT** open to `anon`/`authenticated` (public reference data).
- **RLS**: `profiles` **SELECT/UPDATE** own row; `plan_tier` changes only via **service_role** (trigger).
- **RLS**: Cache table — enabled RLS, **no** user policies; **no** `authenticated` grants.

---

## STEP 4 — Server-side access

- **`server/utils/db/plan-limits.ts`** — Read `plan_limits`.
- **`server/utils/db/profiles.ts`** — Load profile (plan tier).
- **`server/utils/db/usage.ts`** — Insert usage + count by UTC day.
- **`server/utils/db/usage-limits.ts`** — `assertCanExecuteSearch`, `assertCanActivateAlert`.
- **`server/utils/db/alerts.ts`** — CRUD-style helpers for user-owned alerts.
- **`server/utils/db/cache.ts`** — Get/upsert cache (**service client**).
- **`server/utils/db/alert-matches.ts`** — Insert match (**service client**).
- **`server/utils/db/search-logs.ts`**, **`saved-searches.ts`** — Optional persistence paths.

---

## STEP 5 — Usage limits foundation

- Seeded **`plan_limits`**: Free **3** searches/day, **1** active alert; Pro **50** / **10**.
- **`assertCanExecuteSearch`** / **`assertCanActivateAlert`** use `plan_limits` + live counts — call from API routes before provider calls (Phase 5+).
- **TODO**: When Stripe updates subscription, update `profiles.plan_tier` (and optionally `subscriptions`) with service role.

---

## STEP 6 — TODOs

- [ ] Wire Nitro API routes to these helpers (search + alerts).
- [ ] Backfill `profiles` for users created before the auth trigger existed.
- [ ] Replace hand-written `types/database.types.ts` with `supabase gen types` after first deploy.
- [ ] Optional: DB-level quota enforcement (triggers) if abuse becomes an issue.
- [ ] Alert scheduler / Resend notifications (not Phase 4).

---

## Phase 5 — suggested next prompt (copy-paste)

> **Phase 5 only:** Implement Nitro server API routes for authenticated users: run award search with `assertCanExecuteSearch`, record `usage_events` + optional `search_logs`, read/write `saved_searches`, CRUD `alerts` with `assertCanActivateAlert` when status is `active`, and use `serverSupabaseServiceRole` + `availability_cache_entries` for shared cache on mock or real provider responses. Do **not** add Stripe webhooks or background alert workers yet; keep Flying Blue MVP scope.
