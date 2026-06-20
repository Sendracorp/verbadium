-- Admin/teacher-recorded audio that overrides the static manifest at runtime.
-- The audio files live in a public Storage bucket (CDN-served, same speed as
-- the committed MP3s); this table maps a course text → the uploaded file.

create table public.audio_overrides (
  id           uuid primary key default gen_random_uuid(),
  course_slug  text not null,
  text_key     text not null,                 -- nativeKey() of the Catalan text
  label        text,                          -- readable Catalan, for the admin list
  storage_path text not null,                 -- path within the 'course-audio' bucket
  recorded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (course_slug, text_key)
);

alter table public.audio_overrides enable row level security;
-- audio is public content: anyone may read the mapping; all writes go through
-- the service role (admin server actions, which bypass RLS).
create policy "read audio overrides" on public.audio_overrides for select using (true);

-- public bucket for the recordings (served over the CDN via the public URL)
insert into storage.buckets (id, name, public)
values ('course-audio', 'course-audio', true)
on conflict (id) do nothing;

-- allow public read of objects in that bucket
create policy "public read course-audio"
  on storage.objects for select
  using (bucket_id = 'course-audio');
