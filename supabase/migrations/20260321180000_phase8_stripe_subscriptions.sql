-- Phase 8 — Stripe: one subscription row per user + Stripe status parity

-- Remove duplicate rows per user (keep oldest by created_at; safe when already unique)
delete from public.subscriptions
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by user_id
        order by created_at asc nulls last, id asc
      ) as rn
    from public.subscriptions
  ) ranked
  where ranked.rn > 1
);

alter table public.subscriptions
  add constraint subscriptions_user_id_unique unique (user_id);

alter table public.subscriptions drop constraint if exists subscriptions_status_check;

alter table public.subscriptions add constraint subscriptions_status_check check (
  status in (
    'none',
    'active',
    'canceled',
    'past_due',
    'trialing',
    'incomplete',
    'incomplete_expired',
    'unpaid',
    'paused'
  )
);
