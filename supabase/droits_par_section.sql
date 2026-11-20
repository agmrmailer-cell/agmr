-- ============================================================
-- Droits d'accès par section, appliqués PAR LA BASE (et plus seulement par l'interface).
-- À exécuter une fois dans Supabase (SQL Editor → Run), APRÈS mise_a_jour_novembre_2026.sql.
-- Sans risque si relancé : les règles d'écriture sont simplement recréées.
--
-- Effets :
--  • Un administrateur ne peut modifier QUE les sections cochées pour lui dans « Gestion des accès »
--    (un super-admin peut tout modifier).
--  • Un compte Supabase qui n'est pas dans admin_profiles ne peut plus rien modifier.
--  • Corrige « vacances_scolaires » qui était modifiable sans être connecté.
--  • Les liens du Planning Rando ne sont plus lisibles publiquement (seulement via le mot de passe adhérents).
--  • Le mot de passe adhérents n'est lisible que par ceux qui ont le droit « Mot de passe adhérents ».
-- La correspondance table → section est reprise dans src/lib/permissions.js (à garder synchronisée).
-- ============================================================

-- 1. Fonctions de contrôle ---------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from admin_profiles p
    where lower(p.email) = lower(auth.jwt() ->> 'email')
  );
$$;

create or replace function public.has_any_admin_permission(perms text[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from admin_profiles p
    where lower(p.email) = lower(auth.jwt() ->> 'email')
      and (p.role = 'super_admin' or p.permissions && perms)
  );
$$;

-- Section dont dépend un texte de site_texts (clé "<page>.<champ>")
create or replace function public.site_text_permission(text_key text)
returns text
language sql immutable
as $$
  select case split_part(text_key, '.', 1)
    when 'home' then 'home'
    when 'planning-rando' then 'planning-rando-page'
    else 'site-texts'
  end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_any_admin_permission(text[]) to authenticated;
grant execute on function public.site_text_permission(text) to anon, authenticated;

-- 2. Règles d'écriture par table ---------------------------------------------
-- Pour chaque table : on supprime les anciennes règles d'écriture (ALL / INSERT / UPDATE / DELETE),
-- on conserve les règles de lecture publique, puis on recrée :
--   lecture admin (toutes les lignes) + écriture réservée aux sections autorisées.

do $$
declare
  rule record;
  pol record;
begin
  for rule in
    select * from (values
      ('home_blocks',                array['home']),
      ('site_stats',                 array['home']),
      ('gym_page_blocks',            array['gym-page']),
      ('gym_disciplines',            array['gym-page']),
      ('gym_animateurs',             array['gym-page', 'comite']),
      ('gym_courses',                array['gym']),
      ('vacances_scolaires',         array['gym']),
      ('rando_page_blocks',          array['rando-page']),
      ('nordique_page_blocks',       array['rando-page']),
      ('rando_jeudi_groupes',        array['rando-page']),
      ('rando_sorties',              array['planning-rando-page']),
      ('planning_rando_page_blocks', array['planning-rando-page']),
      ('sante_page_blocks',          array['sante-page']),
      ('asso_page_blocks',           array['asso-page']),
      ('actualites',                 array['actu']),
      ('sejours',                    array['sejours']),
      ('galerie_photos',             array['galerie']),
      ('ag_documents',               array['ag']),
      ('bureau',                     array['comite']),
      ('tarifs',                     array['tarifs']),
      ('external_links',             array['links', 'planning-rando-page'])
    ) as t(tbl, perms)
  loop
    if to_regclass('public.' || rule.tbl) is null then
      raise notice 'Table % absente : ignorée', rule.tbl;
      continue;
    end if;

    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = rule.tbl and cmd <> 'SELECT'
    loop
      execute format('drop policy %I on public.%I', pol.policyname, rule.tbl);
    end loop;

    execute format('drop policy if exists %I on public.%I', 'admin_select', rule.tbl);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin())', 'admin_select', rule.tbl);

    execute format('drop policy if exists %I on public.%I', 'section_insert', rule.tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_any_admin_permission(%L::text[]))', 'section_insert', rule.tbl, rule.perms);

    execute format('drop policy if exists %I on public.%I', 'section_update', rule.tbl);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_any_admin_permission(%L::text[])) with check (public.has_any_admin_permission(%L::text[]))', 'section_update', rule.tbl, rule.perms, rule.perms);

    execute format('drop policy if exists %I on public.%I', 'section_delete', rule.tbl);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_any_admin_permission(%L::text[]))', 'section_delete', rule.tbl, rule.perms);
  end loop;
end $$;

-- 3. Cas particuliers -------------------------------------------------------

-- Liens : les plannings rando ne sont plus lisibles publiquement
drop policy if exists "external_links_public_read" on public.external_links;
create policy "external_links_public_read" on public.external_links for select
  to anon, authenticated
  using (
    active = true
    and members_only = false
    and not (zones @> array['planning-rando'])
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- Textes du site : le droit dépend de la page du texte
drop policy if exists "site_texts_admin_all" on public.site_texts;
drop policy if exists "site_texts_insert" on public.site_texts;
drop policy if exists "site_texts_update" on public.site_texts;
drop policy if exists "site_texts_delete" on public.site_texts;
create policy "site_texts_insert" on public.site_texts for insert to authenticated
  with check (public.has_any_admin_permission(array[public.site_text_permission(key)]));
create policy "site_texts_update" on public.site_texts for update to authenticated
  using (public.has_any_admin_permission(array[public.site_text_permission(key)]))
  with check (public.has_any_admin_permission(array[public.site_text_permission(key)]));
create policy "site_texts_delete" on public.site_texts for delete to authenticated
  using (public.has_any_admin_permission(array[public.site_text_permission(key)]));

-- Réglages privés (mot de passe adhérents)
drop policy if exists "site_settings_admin_all" on public.site_settings;
drop policy if exists "site_settings_section" on public.site_settings;
create policy "site_settings_section" on public.site_settings for all to authenticated
  using (public.has_any_admin_permission(array['members-password']))
  with check (public.has_any_admin_permission(array['members-password']));

-- Bandeau d'info : tous les administrateurs
drop policy if exists "admin_all_banners" on public.site_banners;
drop policy if exists "site_banners_admin" on public.site_banners;
create policy "site_banners_admin" on public.site_banners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Journal d'activité : écriture et lecture réservées aux administrateurs
drop policy if exists "activity_log_insert" on public.activity_log;
drop policy if exists "activity_log_select" on public.activity_log;
create policy "activity_log_insert" on public.activity_log for insert to authenticated with check (public.is_admin());
create policy "activity_log_select" on public.activity_log for select to authenticated using (public.is_admin());

-- Messages de contact : lecture réservée aux administrateurs (l'envoi public reste inchangé)
drop policy if exists "Authenticated users can read contact messages" on public.contact_messages;
create policy "Authenticated users can read contact messages" on public.contact_messages for select to authenticated using (public.is_admin());
