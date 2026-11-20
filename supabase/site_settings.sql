-- Réglages privés du site (ex. mot de passe adhérents).
-- AUCUN accès public : seuls les administrateurs connectés et le serveur (service_role) peuvent lire/écrire.
create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.site_settings enable row level security;

revoke all on table public.site_settings from anon;
grant select, insert, update, delete on table public.site_settings to authenticated;
grant all privileges on table public.site_settings to service_role;

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings
  for all to authenticated
  using (true)
  with check (true);
