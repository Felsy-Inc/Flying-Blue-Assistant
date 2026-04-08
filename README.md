# Flying Blue Assistant (MVP)

Nuxt 4 + TypeScript: Flying Blue–focused award search, alerts, optional Stripe billing, and email via Resend.

**Working title (user-facing):** *Flying Blue Assistant*. The npm package name is `flying-blue-assistant`.

## Quick start

```bash
pnpm install
cp .env.example .env
# Fill .env (at minimum Supabase URL + anon key for auth and app routes)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Marketing routes work without Supabase; `/app/*` needs a signed-in user once Supabase is configured.

## Documentation

| Doc | Contents |
|-----|-----------|
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Layers, request flows, auth, flags, deployment sketch |
| **[.env.example](.env.example)** | All env vars with short comments |
| **[supabase/README.md](supabase/README.md)** | Applying migrations, local vs hosted |

## Integrations (checklist)

### Supabase

1. Create a project; copy **Project URL** and **anon (publishable) key**.
2. Set `SUPABASE_URL`, `SUPABASE_KEY`, `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY` (same URL/anon as in `.env.example`).
3. Run migrations from `supabase/migrations/` (see `supabase/README.md`).
4. **Authentication → URL configuration**: Site URL = your app origin (e.g. `http://localhost:3000` or production URL). Add redirect URLs for `/auth/confirm` (and magic link flows).
5. Optional but typical for server jobs/cache: `SUPABASE_SECRET_KEY` (service role) — never expose to the client.
6. Regenerate `types/database.types.ts` when the schema changes (`supabase gen types`).

### Stripe (subscriptions)

1. Create products/prices; set `STRIPE_PRICE_PRO_MONTHLY` (and optional yearly later).
2. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` from the Stripe dashboard.
3. Point the webhook endpoint at your deployed **`/api/billing/webhook`** (or the path Nitro exposes on your host).
4. Enable billing in the app: `BILLING_ENABLED=true` and `NUXT_PUBLIC_BILLING_ENABLED=true` (or equivalent in `nuxt.config` public runtime config) so client and server agree.
5. After checkout, users return with query params handled on `/app/account` (sync + toast).

### Resend (email)

1. `RESEND_API_KEY`, `EMAIL_FROM` (verified domain/sender in Resend).
2. `EMAILS_ENABLED=true` to send; alert/cron paths respect this flag.
3. Dev-only test route: `POST /api/app/email/test-alert` (see code and comments in `.env.example` for `EMAIL_TEST_ALLOW_TO_OVERRIDE`).

### Vercel

1. Connect the repo; set **all** production env vars from `.env.example`.
2. Build: `pnpm build` (default; Nitro uses `vercel` preset when `VERCEL` is set).
3. Configure **cron** (or external scheduler) to call `GET /api/cron/process-alerts` with header `Authorization: Bearer <CRON_SECRET>`.
4. Ensure `NUXT_PUBLIC_APP_URL` matches the deployment URL for auth redirects.

## Project layout

- **`app/`** — Pages, layouts, components, composables, assets (Nuxt `srcDir`).
- **`lib/`** — Shared logic, Zod schemas, i18n (`~lib` alias).
- **`server/api/`** — Nitro routes.
- **`server/utils/`** — DB, billing, notifications, `requireSupabaseSession`, `throwValidationFailed`, etc.
- **`app/components/fba/*`** — Design-system-style primitives (`FbaPageContainer`, `FbaSearchForm`, …).

## Stack notes

- **Nuxt 4**, **Nuxt UI v4**, **Tailwind CSS v4**.
- **pnpm** with `onlyBuiltDependencies` to reduce install friction.
- **Sourcemaps**: specific Tailwind warnings are filtered in `nuxt.config.ts`; SSR server sourcemaps optional via `NUXT_SOURCEMAP=true` (see `.env.example`).

## Troubleshooting

- **`ENOTDIR` / `.nuxt/cache/...`**: Payload extraction is disabled in `nuxt.config.ts`. If you re-enable it, clear `.nuxt` and `node_modules/.cache/nuxt`.
- **Missing `plan_limits` / tables**: Run Phase 4+ migrations on Supabase; until then some APIs fail open or skip optional writes (see code comments).
- **Billing buttons missing**: Expected when `billingEnabled` is false — see neutral alert on Account; enable flags + Stripe keys.

## License

See repository root for license if present.
