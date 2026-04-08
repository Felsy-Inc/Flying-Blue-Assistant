# Supabase migrations (Phase 4+)

SQL lives in `migrations/`. Filenames are ordered by timestamp prefix.

## Apply on your Supabase project

Run **all** migration files in `migrations/` in filename order. The `subscriptions` table is created in `20260320140000_phase4_initial_schema.sql`; Phase 8 alters it in `20260321180000_phase8_stripe_subscriptions.sql`. Phase 9 adds `email_send_logs` in `20260329120000_phase9_email_send_logs.sql`. Phase 10 grants `service_role` on that table in `20260329150000_phase10_service_role_email_logs.sql` (cron alert emails).

If the API returns **`PGRST205` — Could not find the table `public.subscriptions` in the schema cache**, the linked project does not have that table yet (or you are pointing `SUPABASE_URL` / keys at another project). Apply migrations, then wait a few seconds or use **Project Settings → API → Reload schema** if your dashboard offers it.

### Option A — Supabase CLI (recommended when linked)

```bash
# one-time: supabase link --project-ref <ref>
supabase db push
```

### Option B — Dashboard SQL editor

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste and run `migrations/20260320140000_phase4_initial_schema.sql`, then `20260321180000_phase8_stripe_subscriptions.sql`, then `20260329120000_phase9_email_send_logs.sql`, then `20260329150000_phase10_service_role_email_logs.sql` (in that order).
3. Re-running the Phase 4 file on an existing project may error on existing objects — prefer CLI `db push` or a clean project for first-time setup.

### Option C — `psql` with connection string

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260320140000_phase4_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20260321180000_phase8_stripe_subscriptions.sql
psql "$DATABASE_URL" -f supabase/migrations/20260329120000_phase9_email_send_logs.sql
psql "$DATABASE_URL" -f supabase/migrations/20260329150000_phase10_service_role_email_logs.sql
```

Use the **pooler** or **direct** connection string from **Project Settings → Database**.

## After migrating

1. Regenerate TS types when the schema changes:

   ```bash
   supabase gen types typescript --linked > types/database.types.ts
   ```

2. Ensure **`SUPABASE_SECRET_KEY`** (service role) is set on the server for code paths that call `serverSupabaseServiceRole` (cache, future workers).

## Auth trigger

`handle_new_user` creates a `public.profiles` row for each `auth.users` signup. Existing users created **before** this migration need a one-off backfill:

```sql
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
where id not in (select id from public.profiles);
```
