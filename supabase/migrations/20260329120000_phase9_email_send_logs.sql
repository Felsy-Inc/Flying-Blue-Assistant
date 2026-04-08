-- Phase 9: audit trail for transactional emails (Resend).

create table public.email_send_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  email_type text not null,
  to_email text not null,
  status text not null check (status in ('skipped', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index email_send_logs_user_created_idx on public.email_send_logs (user_id, created_at desc);

comment on table public.email_send_logs is 'Transactional email attempts (types e.g. alert_test, alert_match); written from authenticated API routes.';

alter table public.email_send_logs enable row level security;

create policy email_send_logs_select_own
  on public.email_send_logs for select
  using (auth.uid() = user_id);

create policy email_send_logs_insert_own
  on public.email_send_logs for insert
  with check (auth.uid() = user_id);
