# Phase 6 — Alerts & dashboard (MVP)

## STEP 1 — Summary

**Before:** Search API + mock availability; `public.alerts` schema from Phase 4; `/app/alerts` was a static empty state with query prefill banner only.

**After:** Full CRUD-style alert APIs (authenticated), dashboard overview (`/api/app/overview`), alerts management UI with slideover editor + delete modal, search → alerts handoff with enriched query params.

## Files added / changed

| Area | Files |
|------|--------|
| Domain | `lib/alerts/alert-schema.ts`, `query-prefill.ts`, `index.ts` |
| API auth helper | `server/utils/api/require-auth.ts` |
| DB | `server/utils/db/alerts.ts` (+ `getAlertByIdForUser`, `deleteAlertForUser`) |
| Routes | `server/api/app/alerts.get/post`, `alerts/[id].patch/delete`, `overview.get.ts` |
| UI | `app/components/fba/alerts/FbaAlertForm.vue`, `FbaAlertCard.vue`, `FbaAlertEditor.vue` |
| Pages | `app/pages/app/index.vue`, `app/pages/app/alerts.vue`, `app/pages/app/search.vue` (query) |
| i18n | `lib/i18n/messages/{en,nl,fr}.ts` — `alerts.*` |

## STEP 7 — TODOs (later phases)

- Scheduled polling / workers reading `next_check_at`, writing `alert_matches`
- Email (Resend) on new matches
- Dashboard “recent matches” from `alert_matches` join
- Stripe-driven `plan_tier` sync affecting limits in real time

## Phase 7 — suggested prompt

> **Phase 7 only:** Implement alert **execution simulation** (manual “Run checks” or a simple cron-friendly Nitro endpoint using **service role**) that runs mock availability against active alerts, inserts `alert_matches`, and surfaces recent matches on the dashboard + alert detail. Add optional **Resend** stub when `EMAILS_ENABLED` and a match occurs. Still **no** production-scale scheduling or real Flying Blue API.
