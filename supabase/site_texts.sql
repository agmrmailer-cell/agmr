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
