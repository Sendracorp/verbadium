-- Admin: comp access grants + reset log + an aggregated overview for /admin.

-- access_grants: access granted by an admin (separate from real Paddle purchases)
create table public.access_grants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_slug text not null,
  granted_by  uuid references public.profiles (id),
  note        text,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index access_grants_user_idx on public.access_grants (user_id, course_slug);
alter table public.access_grants enable row level security;
-- users may read their own grants (so access checks work under their session);
-- all writes go through the service role (no write policy = denied for users)
create policy "read own grants" on public.access_grants
  for select using (auth.uid() = user_id);

-- progress_resets: one row per "reset all progress" a user performs
create table public.progress_resets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  created_at  timestamptz not null default now()
);
create index progress_resets_user_idx on public.progress_resets (user_id, course_slug);
alter table public.progress_resets enable row level security;
create policy "own resets" on public.progress_resets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- aggregated per-user overview for the admin dashboard. security_invoker so RLS
-- of the underlying tables applies to the caller; revoked from anon/authenticated
-- so only the service role (admin client) can read the whole table.
create view public.admin_user_overview
with (security_invoker = on) as
select
  p.id, p.email, p.created_at, p.is_admin,
  (select count(*) from public.purchases pu where pu.user_id = p.id and pu.status = 'paid') as purchases,
  (select count(*) from public.access_grants g where g.user_id = p.id and g.revoked_at is null) as grants,
  (select count(*) from public.exercise_progress e where e.user_id = p.id and e.state = 'passed') as passed,
  (select count(*) from public.mock_attempts m where m.user_id = p.id) as mock_attempts,
  (select count(*) from public.progress_resets r where r.user_id = p.id) as resets,
  (select max(e.updated_at) from public.exercise_progress e where e.user_id = p.id) as last_active
from public.profiles p;

revoke all on public.admin_user_overview from anon, authenticated;
