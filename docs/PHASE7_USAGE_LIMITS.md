# Phase 7 — Plan-aware usage limits (MVP)

## STEP 1 — Review (before changes)

**Already in place**

- `public.plan_limits` seeded: Free 3 searches/day + 1 active alert; Pro 50 + 10.
- `usage_events` with `search_executed` counted per **UTC calendar day** (`countUsageEventsForUtcDay`).
- Active alerts = rows with `status = 'active'` (`countActiveAlertsForUser`).
- `POST /api/app/search` called `assertCanExecuteSearch` before the provider; `POST /api/app/alerts` and resume path on `PATCH` enforced active-alert cap.
- `GET /api/app/overview` exposed plan tier, limits, and usage for the dashboard.

**Gaps addressed in Phase 7**

- Duplicated “fetch profile → tier → limits” in each route; no **code fallback** if `plan_limits` row missing.
- Swallowing **all** errors on `insertUsageEvent` after search (RLS failure = unlimited searches).
- UI: metrics on dashboard only; search/alerts pages lacked **banners**, **disabled submit**, and **overview refresh** after mutations.

## STEP 2 — Usage model

| Signal | Source | Reset / rules |
|--------|--------|----------------|
| Daily searches | Count `usage_events` where `event_type = search_executed` and `created_at` in **UTC day** | New day at `00:00 UTC` |
| Active alerts | Count `alerts` where `status = 'active'` | Paused/deleted rows excluded |
| Plan | `profiles.plan_tier` (`free` \| `pro`), default **`free`** if profile missing/invalid | N/A |
| Limits | Prefer `plan_limits` row; else **`lib/billing/plan-limits-defaults.ts`** (same numbers as seed) | Extensible: add tier in DB + defaults |

## STEP 3 — Server enforcement

| Endpoint | Behaviour |
|----------|-----------|
| `POST /api/app/search` | `getUserPlanContext` → `assertCanExecuteSearch`; **429** `search_daily_limit` if `used >= limit`. After successful provider call, `insertUsageEvent`; **503** `usage_write_failed` if insert fails for non–missing-table errors (missing table still tolerated for greenfield dev). |
| `POST /api/app/alerts` | If `body.status === 'active'`, `assertCanActivateAlert`; **429** `active_alert_limit`. **Paused** creates skip quota. |
| `PATCH /api/app/alerts/:id` | If `next.status === 'active'` and `existing.status !== 'active'`, `assertCanActivateAlert`; **429** if at cap. Covers paused→active and any future non-active→active transition. |

**Helpers**

- `server/utils/billing/user-plan.ts` — `getUserPlanContext(supabase, userId)`.
- `server/utils/db/usage-limits.ts` — `assertCanExecuteSearch`, `assertCanActivateAlert` (take **effective** numeric limits).

## STEP 4 — UI feedback

- `useAppOverview()` — shared `useFetch` with `key: 'app-overview'`.
- `FbaUsageLimitBanner` — warning `UAlert` + optional **Upgrade** to `/pricing` when `planTier !== 'pro'`.
- **Dashboard** (`/app`): banners when `searchQuotaExhausted` / `activeAlertQuotaExhausted`; footnote on UTC day for searches.
- **Search** (`/app/search`): banner; `FbaSearchForm` `quotaBlocked` disables submit; `refreshOverview()` after successful search.
- **Alerts** (`/app/alerts`): banner when active quota full; `syncLists()` = refresh alerts + overview after pause/resume/delete/save.

`GET /api/app/overview` now includes:

- `usage.searchQuotaExhausted`, `usage.activeAlertQuotaExhausted`
- `planLimits` always populated (DB or defaults)

## STEP 5 — Edge cases

- **Paused vs active:** only `active` counts toward cap; resume re-checks cap.
- **Deleted:** row gone → count drops.
- **No profile / no subscription row:** tier **free**, limits from defaults.
- **Pro at own limit:** banner still shows; **no** upgrade CTA (`showUpgradeCta` false).

## STEP 6 — Assumptions & limitations

- **UTC day** for search quota (documented in UI); not user-local midnight.
- **Race:** two parallel searches can both pass the count check before either insert; acceptable for MVP (tightening = transactional counter or DB constraint later).
- **Stripe / checkout:** out of scope; `plan_tier` remains manual/service-role until billing phase.

---

## Next prompt — Phase 8 only

```
Phase 8 — Alert matching & notifications (MVP):
- Background or scheduled job that evaluates active alerts against availability (reuse mock/cache layer where possible).
- Write rows to `public.alert_matches` with sensible `summary` / `details`.
- Email notification via Resend when a new match is created (respect `EMAILS_ENABLED` / feature flags).
- Optional: record `usage_events.event_type = alert_check` for observability (no user-facing quota in MVP unless specified).
- Document runbook, env vars, and failure modes in docs/PHASE8_ALERT_MATCHING.md.
Do not implement Stripe; plan tier remains as today.
```
