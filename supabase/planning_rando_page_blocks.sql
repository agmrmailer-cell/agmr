create table if not exists public.planning_rando_page_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  label text not null,
  content jsonb not null default '{}'::jsonb,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.planning_rando_page_blocks enable row level security;

grant select on table public.planning_rando_page_blocks to anon;
grant select, insert, update, delete on table public.planning_rando_page_blocks to authenticated;
grant all privileges on table public.planning_rando_page_blocks to service_role;

drop policy if exists "planning_rando_page_blocks_public_read" on public.planning_rando_page_blocks;
create policy "planning_rando_page_blocks_public_read" on public.planning_rando_page_blocks
  for select to anon, authenticated
  using (true);

drop policy if exists "planning_rando_page_blocks_admin_all" on public.planning_rando_page_blocks;
create policy "planning_rando_page_blocks_admin_all" on public.planning_rando_page_blocks
  for all to authenticated
  using (true)
  with check (true);

insert into public.planning_rando_page_blocks (block_key, label, content, ordre)
values
  (
    'header',
    'En-tête de page',
    '{"crumb":"Accueil / Planning / Rando & Nordique","eyebrow":"Planning · Saison 2025-2026","title":"Planning Rando & Nordique","lede":"Calendrier des sorties randonnée et des séances de marche nordique."}'::jsonb,
    10
  ),
  (
    'links',
    'Bloc des liens',
    '{"title":"Plannings complets en ligne","intro":"Calendriers, documents et ressources externes pour la saison en cours."}'::jsonb,
    20
  )
on conflict (block_key) do nothing;
