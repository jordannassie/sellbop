-- 009_add_app_settings.sql
-- Platform-wide key/value settings for admin-controlled flags (e.g. demo mode).

create table if not exists public.app_settings (
  key         text        primary key,
  value       jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Anyone can read settings (needed for server-side page checks)
alter table public.app_settings enable row level security;

create policy "Public read app_settings"
  on public.app_settings for select
  using (true);

-- Only service role can write (admin API routes use getSupabaseAdminClient)
create policy "Service role write app_settings"
  on public.app_settings for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- Seed: demo mode OFF by default
insert into public.app_settings (key, value)
values ('demo_mode', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
