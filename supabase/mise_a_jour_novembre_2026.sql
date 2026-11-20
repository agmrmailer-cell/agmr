-- ============================================================
-- Mise à jour à exécuter UNE fois dans Supabase (SQL Editor → Run).
-- Sans risque si relancée : rien n'est supprimé.
--   1. site_texts    : textes éditables du site (éditeur visuel, Planning Rando…)
--   2. site_settings : réglages privés (mot de passe adhérents)
-- ============================================================

-- Textes éditables du site (éditeur WYSIWYG du back-office)
create table if not exists public.site_texts (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_texts enable row level security;

grant select on table public.site_texts to anon;
grant select, insert, update, delete on table public.site_texts to authenticated;
grant all privileges on table public.site_texts to service_role;

drop policy if exists "site_texts_public_read" on public.site_texts;
create policy "site_texts_public_read" on public.site_texts
  for select to anon, authenticated
  using (true);

drop policy if exists "site_texts_admin_all" on public.site_texts;
create policy "site_texts_admin_all" on public.site_texts
  for all to authenticated
  using (true)
  with check (true);

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
