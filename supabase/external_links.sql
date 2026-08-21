create table if not exists public.external_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  kind text not null default 'external' check (kind = any (array['planning','payment','album','video','document','external'])),
  zones text[] not null default '{}',
  active boolean not null default true,
  members_only boolean not null default false,
  ordre integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.external_links enable row level security;

grant select on table public.external_links to anon;
grant select, insert, update, delete on table public.external_links to authenticated;
grant all privileges on table public.external_links to service_role;

drop policy if exists "external_links_public_read" on public.external_links;
create policy "external_links_public_read" on public.external_links for select
  to anon, authenticated
  using (
    active = true
    and members_only = false
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "external_links_admin_all" on public.external_links;
create policy "external_links_admin_all" on public.external_links for all to authenticated
  using (true)
  with check (true);
