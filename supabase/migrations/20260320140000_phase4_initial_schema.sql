-- Phase 4 — MVP schema: Flying Blue first, loyalty-program extensible, RLS-ready.
-- Apply via Supabase SQL editor or `supabase db push` (see supabase/README.md).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Loyalty programs (MVP: flying_blue only; add rows for future programs)
-- ---------------------------------------------------------------------------
create table public.loyalty_programs (
  slug text primary key,
  name text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.loyalty_programs is 'Supported loyalty programs; FK targets use slug for stable human-readable keys.';

-- ---------------------------------------------------------------------------
-- Plan limits (source of truth for enforcement; seed free/pro)
-- ---------------------------------------------------------------------------
create table public.plan_limits (
  plan_tier text primary key check (plan_tier in ('free', 'pro')),
  max_searches_per_day int not null check (max_searches_per_day > 0),
  max_active_alerts int not null check (max_active_alerts >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.plan_limits is 'Entitlements per billing tier; extend with new plan_tier rows when adding products.';

-- ---------------------------------------------------------------------------
-- Profiles (1:1 auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_loyalty_program_slug text not null default 'flying_blue' references public.loyalty_programs (slug),
  plan_tier text not null default 'free' references public.plan_limits (plan_tier),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.plan_tier is 'Denormalized effective tier for fast reads; reconcile with subscriptions when Stripe sync exists.';

-- ---------------------------------------------------------------------------
-- Subscriptions (Stripe fields reserved; no sync logic in Phase 4)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none' check (
    status in ('none', 'active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid')
  ),
  plan_tier text not null default 'free' references public.plan_limits (plan_tier),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

comment on table public.subscriptions is 'Billing state; webhook/worker updates via service role in a later phase.';

-- ---------------------------------------------------------------------------
-- Usage events (limit enforcement + audit; aggregate by day in app)
-- ---------------------------------------------------------------------------
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  loyalty_program_slug text references public.loyalty_programs (slug),
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index usage_events_user_day_type_idx on public.usage_events (
  user_id,
  ((created_at at time zone 'UTC')::date),
  event_type
);

comment on table public.usage_events is 'Append-only usage; use event_type e.g. search_executed, alert_run. Limits enforced in application using plan_limits.';

-- ---------------------------------------------------------------------------
-- Search logs (optional richer analytics than usage_events)
-- ---------------------------------------------------------------------------
create table public.search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  loyalty_program_slug text not null references public.loyalty_programs (slug),
  params jsonb not null default '{}'::jsonb,
  result_count int,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index search_logs_user_created_idx on public.search_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Saved searches (reusable criteria)
-- ---------------------------------------------------------------------------
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  loyalty_program_slug text not null references public.loyalty_programs (slug),
  label text,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_searches_user_idx on public.saved_searches (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Availability / search result cache (shared fingerprint; service role writes)
-- ---------------------------------------------------------------------------
create table public.availability_cache_entries (
  id uuid primary key default gen_random_uuid(),
  loyalty_program_slug text not null references public.loyalty_programs (slug),
  fingerprint text not null,
  search_params jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'flying_blue_mvp',
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (loyalty_program_slug, fingerprint)
);

create index availability_cache_expires_idx on public.availability_cache_entries (expires_at);

comment on table public.availability_cache_entries is 'Deduplicated provider responses; no user RLS — accessed only with service role from server/cron.';

-- ---------------------------------------------------------------------------
-- Alerts
-- ---------------------------------------------------------------------------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  loyalty_program_slug text not null references public.loyalty_programs (slug),
  origin_airport text not null check (char_length(origin_airport) = 3),
  destination_airport text not null check (char_length(destination_airport) = 3),
  trip_type text not null check (trip_type in ('one_way', 'round_trip')),
  outbound_date_start date not null,
  outbound_date_end date,
  return_date_start date,
  return_date_end date,
  cabin text not null check (cabin in ('economy', 'premium_economy', 'business', 'first')),
  passenger_count int not null default 1 check (passenger_count >= 1 and passenger_count <= 9),
  max_miles int,
  max_taxes_amount numeric(12, 2),
  max_taxes_currency text default 'EUR',
  direct_only boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused')),
  next_check_at timestamptz,
  last_checked_at timestamptz,
  check_interval_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alerts_round_trip_return check (
    (trip_type = 'one_way' and return_date_start is null and return_date_end is null)
    or (trip_type = 'round_trip' and return_date_start is not null)
  ),
  constraint alerts_outbound_range check (
    outbound_date_end is null or outbound_date_end >= outbound_date_start
  ),
  constraint alerts_return_range check (
    return_date_end is null
    or return_date_start is null
    or return_date_end >= return_date_start
  )
);

create index alerts_user_status_idx on public.alerts (user_id, status);
create index alerts_next_check_idx on public.alerts (next_check_at) where status = 'active';

comment on column public.alerts.outbound_date_end is 'Null = single outbound day (same as outbound_date_start).';
comment on column public.alerts.return_date_end is 'Null = single return day when return_date_start set.';
comment on column public.alerts.check_interval_minutes is 'Optional per-alert override; scheduler can default from plan_limits later.';

-- ---------------------------------------------------------------------------
-- Alert matches (results tied to an alert; usually written by service role)
-- ---------------------------------------------------------------------------
create table public.alert_matches (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  loyalty_program_slug text not null references public.loyalty_programs (slug),
  matched_at timestamptz not null default now(),
  cache_entry_id uuid references public.availability_cache_entries (id) on delete set null,
  summary text,
  details jsonb not null default '{}'::jsonb,
  digest_hash text
);

create index alert_matches_alert_idx on public.alert_matches (alert_id, matched_at desc);

-- ---------------------------------------------------------------------------
-- Seeds
-- ---------------------------------------------------------------------------
insert into public.loyalty_programs (slug, name, sort_order) values
  ('flying_blue', 'Flying Blue', 0);

insert into public.plan_limits (plan_tier, max_searches_per_day, max_active_alerts) values
  ('free', 3, 1),
  ('pro', 50, 10);

-- ---------------------------------------------------------------------------
-- updated_at + profile billing field protection (plan_tier only service_role)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.profiles_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.plan_tier := old.plan_tier;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_before_update
  before update on public.profiles
  for each row execute function public.profiles_before_update();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger saved_searches_set_updated_at
  before update on public.saved_searches
  for each row execute function public.set_updated_at();

create trigger alerts_set_updated_at
  before update on public.alerts
  for each row execute function public.set_updated_at();

create trigger plan_limits_set_updated_at
  before update on public.plan_limits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: auto-create profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.loyalty_programs enable row level security;
alter table public.plan_limits enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.search_logs enable row level security;
alter table public.saved_searches enable row level security;
alter table public.availability_cache_entries enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_matches enable row level security;

-- Reference data: readable by anyone with a JWT or anon (pricing UI)
create policy loyalty_programs_select_all
  on public.loyalty_programs for select
  using (true);

create policy plan_limits_select_all
  on public.plan_limits for select
  using (true);

-- Profiles: own row only
create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id);

-- Subscriptions: read-only for owner (writes via service role later)
create policy subscriptions_select_own
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Usage & search logs: insert + read own
create policy usage_events_select_own
  on public.usage_events for select
  using (auth.uid() = user_id);

create policy usage_events_insert_own
  on public.usage_events for insert
  with check (auth.uid() = user_id);

create policy search_logs_select_own
  on public.search_logs for select
  using (auth.uid() = user_id);

create policy search_logs_insert_own
  on public.search_logs for insert
  with check (auth.uid() = user_id);

-- Saved searches
create policy saved_searches_all_own
  on public.saved_searches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Alerts
create policy alerts_all_own
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Alert matches: read via parent alert only; inserts from workers use service role
create policy alert_matches_select_own
  on public.alert_matches for select
  using (
    exists (
      select 1 from public.alerts a
      where a.id = alert_matches.alert_id and a.user_id = auth.uid()
    )
  );

-- Cache: no policies for authenticated — only service_role bypasses RLS

-- ---------------------------------------------------------------------------
-- Grants (Supabase roles)
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on public.loyalty_programs to anon, authenticated;
grant select on public.plan_limits to anon, authenticated;

grant select, update on public.profiles to authenticated;

grant select on public.subscriptions to authenticated;

grant select, insert on public.usage_events to authenticated;
grant select, insert on public.search_logs to authenticated;

grant select, insert, update, delete on public.saved_searches to authenticated;

grant select, insert, update, delete on public.alerts to authenticated;

grant select on public.alert_matches to authenticated;

grant all on public.availability_cache_entries to service_role;
grant all on public.alert_matches to service_role;
grant all on public.usage_events to service_role;
grant all on public.search_logs to service_role;
grant all on public.saved_searches to service_role;
grant all on public.alerts to service_role;
grant all on public.profiles to service_role;
grant all on public.subscriptions to service_role;
grant all on public.plan_limits to service_role;
grant all on public.loyalty_programs to service_role;
