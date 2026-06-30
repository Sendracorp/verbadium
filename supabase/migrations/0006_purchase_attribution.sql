-- First-party campaign attribution captured at checkout (utm_*, gclid, referrer…),
-- written by the Paddle transaction.completed webhook. Used to compute CAC/ROAS
-- per campaign from our own data. Nullable; no PII.
alter table public.purchases add column if not exists attribution jsonb;
