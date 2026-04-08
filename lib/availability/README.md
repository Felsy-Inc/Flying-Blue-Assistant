# Availability domain layer

Flying Blue–only MVP. The app talks to a small **provider** contract; implementations can be mock, HTTP APIs, or ingestion jobs.

## Layers

| Piece | Role |
|--------|------|
| **`domain-models.ts`** | Canonical types: `AvailabilitySearchInput`, `AvailabilitySegment`, `AvailabilityItinerary`, `AvailabilityPrice`, `AvailabilitySearchResult`, `ProviderCapabilities`, `AvailabilitySearchContext`, value labels. |
| **`domain.ts`** | HTTP/UI shapes: `NormalizedAwardOffer`, `AvailabilitySearchResponse`, plus re-exports. |
| **`mappers.ts`** | `AvailabilitySearchResult` → `NormalizedAwardOffer`; `searchResultsToApiResponse`. |
| **`provider.ts`** | `AvailabilityProvider`, optional `AvailabilitySearchCache`, `AvailabilitySearchNormalizer<TRaw>`. |
| **`scoring.ts`** | `computeAwardValueAssessment` → Promo / Strong value / Good / Fair / High surcharges. |
| **`mock-provider.ts`** | Deterministic-ish demo data (OW/RT, cabins, direct/1-stop, flex dates). |

## Flow

1. Nitro route (e.g. `POST /api/app/search`) validates body → `AvailabilitySearchInput`.
2. `resolveAvailabilityProvider(...)` returns an `AvailabilityProvider`.
3. `provider.search(input)` returns **`AvailabilitySearchResponse`** (flattened `offers`), never a vendor-specific type.
4. Optional: `createCachedAvailabilityProvider` wraps any provider and stores that same JSON shape.

Inside a real implementation you typically:

1. Call the external API or read ingested rows.
2. Map rows through an **`AvailabilitySearchNormalizer<YourRawType>`** into `AvailabilitySearchResult[]`.
3. Call **`searchResultsToApiResponse(input, results, { providerId, cacheHit })`** and return.

That keeps **one** wire format for the client, cache, and cron, while raw payloads stay inside the provider/normalizer.

## Plugging in a real provider (no app rewrite)

1. **Add a class** in e.g. `lib/availability/providers/flying-blue-api.ts` that implements `AvailabilityProvider`:
   - `id` — stable string (used in cache `source`).
   - `getCapabilities()` — set `dataSource: 'partner_api'`, flags for RT/flex, etc.
   - `search(input)` — fetch/transform, then `searchResultsToApiResponse(...)`.

2. **Register it** in `server/utils/availability/resolve-provider.ts`:
   - Extend `ProviderMode` (or use env `AVAILABILITY_PROVIDER=mock|flying_blue_api`).
   - Return the new instance instead of `mockAvailabilityProvider` when configured.

3. **Normalize only inside the provider** (or a dedicated normalizer module). Do not import vendor types from Vue or generic server routes.

4. **Ingestion / scraping**: same interface; set `dataSource: 'ingestion'`, read from your DB or queue, map rows in a normalizer, return the same `AvailabilitySearchResponse`.

5. **Tests**: unit-test the normalizer with fixture JSON; integration-test the provider against a mocked `fetch`.

## Types quick reference

- **`AvailabilitySearchInput`** — what the user asked for (aligned with Zod body + alerts).
- **`AvailabilitySearchResult`** — one quote in structured form (itineraries + `AvailabilityPrice` + `AwardValueAssessment`).
- **`NormalizedAwardOffer`** — flat row for JSON + Vue (derived via mapper).

`AvailabilitySearchRequest` is a deprecated alias of `AvailabilitySearchInput` for older imports.
