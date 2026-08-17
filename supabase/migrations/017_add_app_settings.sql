-- 017_add_app_settings.sql
-- Platform-wide key/value settings for admin-controlled flags (e.g. demo mode).

create table if not exists public.app_settings (
  key         text        primary key,
  value       jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "Public read app_settings" on public.app_settings;
create policy "Public read app_settings"
  on public.app_settings for select
  using (true);

drop policy if exists "Service role write app_settings" on public.app_settings;
create policy "Service role write app_settings"
  on public.app_settings for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

insert into public.app_settings (key, value)
values ('demo_mode', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;

notify pgrst, 'reload schema';
