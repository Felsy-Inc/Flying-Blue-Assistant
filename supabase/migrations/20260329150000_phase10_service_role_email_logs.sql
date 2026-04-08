-- Phase 10: cron uses service_role for `email_send_logs` inserts during alert_match sends.
grant all on public.email_send_logs to service_role;
