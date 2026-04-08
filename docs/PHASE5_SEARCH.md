# Phase 5 — Mock availability search & provider architecture

## STEP 1 — Architecture (summary)

| Piece | Location | Role |
|--------|-----------|------|
| **Search request** | `AvailabilitySearchRequest` in `lib/availability/domain.ts` | Normalized input (Flying Blue MVP, extensible `loyaltyProgramSlug`). |
| **Normalized result** | `NormalizedAwardOffer`, `AvailabilitySearchResponse` | Provider output + date window metadata. |
| **Provider interface** | `AvailabilityProvider` in `lib/availability/provider.ts` | `search(request) → response`. |
| **Mock implementation** | `MockAvailabilityProvider` in `lib/availability/mock-provider.ts` | Deterministic-enough variety (stops, cabins, RT, filters). |
| **Value / deal badge** | `computeValueTier` in `lib/availability/scoring.ts` | Miles vs route/cabin baseline (heuristic, not airline truth). |
| **Validation** | `availabilitySearchBodySchema` in `lib/availability/search-request.zod.ts` | Shared rules for API + form. |
| **Cache fingerprint** | `availabilityRequestFingerprint` in `lib/availability/fingerprint.ts` | Stable SHA-256 for cache keys. |
| **Cache wrapper** | `createCachedAvailabilityProvider` in `server/utils/availability/cached-provider.ts` | DB cache via `availability_cache_entries` + service role. |
| **Provider resolution** | `resolveAvailabilityProvider` in `server/utils/availability/resolve-provider.ts` | Chooses mock + optional cache (future: env-driven real provider). |
| **HTTP API** | `server/api/app/search.post.ts` | Auth, quota (`assertCanExecuteSearch`), usage + search_logs, provider call. |
| **UI** | `app/components/fba/search/*`, `app/pages/app/search.vue` | Form, results, date strip, no mock data in page shell. |

## Replacing mock with a real provider

1. Add `lib/availability/flying-blue-api-provider.ts` (or scrape adapter) implementing `AvailabilityProvider`.
2. Extend `resolve-provider.ts` to select implementation from `runtimeConfig` / env (e.g. `AVAILABILITY_PROVIDER=mock|flying_blue_api`).
3. Map external responses into `NormalizedAwardOffer` (single place).
4. Keep **validation + cache + quotas** in the API route; swap only the inner provider.

## Phase 6 — suggested prompt

> **Phase 6 only:** Persist alerts from search + alerts UI: use Supabase `alerts` table with `assertCanActivateAlert`, build create/edit alert forms (prefill from `/app/alerts` query params and from search results), list user alerts, toggle active/paused. Add optional Resend email stub when a match is simulated — **no** production alert scheduler yet unless trivial cron stub.
