-- Catalan course platform — initial schema.
-- Run in the Supabase SQL editor (or `supabase db push`) once per project.

-- ───────────────────────────── profiles ─────────────────────────────
-- One row per auth user, auto-created on signup. is_admin gates /admin.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  display_name text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────── purchases ────────────────────────────
-- Written exclusively by the Lemon Squeezy webhook (service role).
-- user_id references profiles (not auth.users) so PostgREST can embed the
-- buyer's email on the admin page; the signup trigger guarantees the row.
create table public.purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  course_slug   text not null,
  ls_order_id   text not null unique,
  status        text not null default 'paid' check (status in ('paid', 'refunded')),
  amount_cents  integer,
  currency      text,
  created_at    timestamptz not null default now(),
  refunded_at   timestamptz
);
create index purchases_user_course_idx on public.purchases (user_id, course_slug);

-- ──────────────────────── exercise_progress ─────────────────────────
create table public.exercise_progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  exercise_id text not null,
  state       text not null check (state in ('untouched', 'attempted', 'passed')),
  score       integer not null default 0,
  total       integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, course_slug, exercise_id)
);

-- ───────────────────────── mock_attempts ────────────────────────────
create table public.mock_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  attempt     jsonb not null,
  created_at  timestamptz not null default now()
);
create index mock_attempts_user_course_idx on public.mock_attempts (user_id, course_slug, created_at);

-- ──────────────────────── checklist_state ───────────────────────────
create table public.checklist_state (
  user_id     uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  items       jsonb not null default '[]',
  updated_at  timestamptz not null default now(),
  primary key (user_id, course_slug)
);

-- ─────────────────────── row level security ─────────────────────────
alter table public.profiles          enable row level security;
alter table public.purchases         enable row level security;
alter table public.exercise_progress enable row level security;
alter table public.mock_attempts     enable row level security;
alter table public.checklist_state   enable row level security;

-- profiles: a user sees only their own row; no client-side writes
-- (the signup trigger and the service role handle inserts/updates).
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- purchases: read own; all writes come from the service role (bypasses RLS).
create policy "read own purchases" on public.purchases
  for select using (auth.uid() = user_id);

-- progress tables: full CRUD on own rows.
create policy "own exercise progress" on public.exercise_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own mock attempts" on public.mock_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own checklist" on public.checklist_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
