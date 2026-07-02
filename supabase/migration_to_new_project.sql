-- =================================================================
-- MIGRATION COMPLÈTE — à exécuter dans l'éditeur SQL Supabase
-- Nouveau projet : aubredxcbtzvqckrjekg
-- =================================================================


-- ----------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------

create table if not exists public.gym_courses (
  id uuid primary key default gen_random_uuid(),
  jour text not null,
  heure_debut text not null,
  heure_fin text not null,
  discipline text not null,
  animateur text not null,
  salle text not null,
  niveau text default 'tous',
  actif boolean default true,
  disc text not null,
  created_at timestamptz default now(),
  complet boolean not null default false,
  tag text,
  recurrence jsonb not null default '{"type":"weekly"}'::jsonb
);

create table if not exists public.rando_sorties (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null,
  titre text not null,
  distance_km integer,
  denivele integer,
  groupes text[] default '{}',
  point_depart text,
  heure_depart text,
  animateur text,
  complet boolean default false,
  annule boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.actualites (
  id uuid primary key default gen_random_uuid(),
  cat text not null,
  date date not null,
  title text not null,
  excerpt text,
  created_at timestamptz default now(),
  image_url text
);

create table if not exists public.sejours (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  dates text not null,
  transport text,
  statut text default 'ouvert',
  description text,
  img text default 'a',
  created_at timestamptz default now(),
  image_url text
);

create table if not exists public.bureau (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  role text not null,
  ordre integer default 0,
  created_at timestamptz default now(),
  photo_url text,
  groupe text not null default 'Membres du bureau'
);

create table if not exists public.galerie_photos (
  id uuid primary key default gen_random_uuid(),
  album text not null,
  nom_fichier text not null,
  url text not null,
  legende text,
  ordre integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.site_stats (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section = any (array['hero','band'])),
  valeur text not null,
  label text not null,
  ordre integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.home_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  label text not null,
  visible boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  ordre integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.gym_page_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  label text not null,
  visible boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  ordre integer not null default 0
);

create table if not exists public.gym_disciplines (
  id uuid primary key default gen_random_uuid(),
  mark text not null default '',
  nom text not null,
  description text not null default '',
  ordre integer not null default 0,
  visible boolean not null default true
);

create table if not exists public.gym_animateurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  role text not null default '',
  disciplines text not null default '',
  photo_url text,
  ordre integer not null default 0,
  visible boolean not null default true
);

create table if not exists public.rando_page_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  label text not null,
  visible boolean default true,
  content jsonb default '{}'::jsonb,
  ordre integer default 0
);

create table if not exists public.rando_jeudi_groupes (
  id uuid primary key default gen_random_uuid(),
  groupe text not null,
  distance text not null,
  retour text not null,
  rdv text not null,
  ordre integer default 0
);

create table if not exists public.nordique_page_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  label text not null,
  visible boolean default true,
  content jsonb default '{}'::jsonb,
  ordre integer default 0
);

create table if not exists public.sante_page_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  label text not null,
  visible boolean default true,
  content jsonb default '{}'::jsonb,
  ordre integer default 0
);

create table if not exists public.asso_page_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  label text not null,
  visible boolean default true,
  content jsonb default '{}'::jsonb,
  ordre integer default 0
);

create table if not exists public.ag_documents (
  id uuid primary key default gen_random_uuid(),
  saison text not null,
  titre text not null,
  url text default '#',
  ordre integer default 0
);

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  role text not null default 'admin' check (role = any (array['super_admin','admin'])),
  permissions text[] not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prenom text not null,
  nom text not null,
  email text not null,
  sujet text not null,
  message text not null,
  source text not null default 'site_web',
  status text not null default 'new',
  user_agent text
);

create table if not exists public.vacances_scolaires (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  date_debut date not null,
  date_fin date not null,
  zone text not null default 'C',
  created_at timestamptz default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  message text not null,
  user_email text,
  section text,
  action text
);

create table if not exists public.tarifs (
  id uuid primary key default gen_random_uuid(),
  categorie text not null,
  label text not null,
  valeur text not null default '',
  ordre integer not null default 0,
  note text
);

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  message text not null default '',
  type text not null default 'info' check (type = any (array['info','warning','urgent'])),
  active boolean not null default false,
  lien text,
  lien_texte text,
  created_at timestamptz default now(),
  expires_at timestamptz
);


-- ----------------------------------------------------------------
-- 2. FONCTION
-- ----------------------------------------------------------------

create or replace function public.get_admin_role()
returns text
language sql
security definer
as $$
  SELECT role FROM admin_profiles
  WHERE email = (SELECT auth.jwt() ->> 'email')
  LIMIT 1;
$$;


-- ----------------------------------------------------------------
-- 3. RLS
-- ----------------------------------------------------------------

alter table public.gym_courses enable row level security;
alter table public.rando_sorties enable row level security;
alter table public.actualites enable row level security;
alter table public.sejours enable row level security;
alter table public.bureau enable row level security;
alter table public.galerie_photos enable row level security;
alter table public.site_stats enable row level security;
alter table public.home_blocks enable row level security;
alter table public.gym_page_blocks enable row level security;
alter table public.gym_disciplines enable row level security;
alter table public.gym_animateurs enable row level security;
alter table public.rando_page_blocks enable row level security;
alter table public.rando_jeudi_groupes enable row level security;
alter table public.nordique_page_blocks enable row level security;
alter table public.sante_page_blocks enable row level security;
alter table public.asso_page_blocks enable row level security;
alter table public.ag_documents enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.contact_messages enable row level security;
alter table public.vacances_scolaires enable row level security;
alter table public.activity_log enable row level security;
alter table public.tarifs enable row level security;
alter table public.site_banners enable row level security;


-- ----------------------------------------------------------------
-- 4. POLICIES
-- ----------------------------------------------------------------

create policy "Lecture publique gym_courses" on public.gym_courses for select using (true);
create policy "Ecriture auth gym_courses" on public.gym_courses for all using (auth.role() = 'authenticated');

create policy "Lecture publique rando_sorties" on public.rando_sorties for select using (true);
create policy "Ecriture auth rando_sorties" on public.rando_sorties for all using (auth.role() = 'authenticated');

create policy "Lecture publique actualites" on public.actualites for select using (true);
create policy "Ecriture auth actualites" on public.actualites for all using (auth.role() = 'authenticated');

create policy "Lecture publique sejours" on public.sejours for select using (true);
create policy "Ecriture auth sejours" on public.sejours for all using (auth.role() = 'authenticated');

create policy "Lecture publique bureau" on public.bureau for select using (true);
create policy "Ecriture auth bureau" on public.bureau for all using (auth.role() = 'authenticated');

create policy "Lecture publique galerie_photos" on public.galerie_photos for select using (true);
create policy "Ecriture auth galerie_photos" on public.galerie_photos for all using (auth.role() = 'authenticated');

create policy "Public read" on public.site_stats for select using (true);
create policy "Auth write" on public.site_stats for all using (auth.role() = 'authenticated');

create policy "Public read" on public.home_blocks for select using (true);
create policy "Auth write" on public.home_blocks for all using (auth.role() = 'authenticated');

create policy "Public read" on public.gym_page_blocks for select using (true);
create policy "Auth write" on public.gym_page_blocks for all using (auth.role() = 'authenticated');

create policy "Public read" on public.gym_disciplines for select using (true);
create policy "Auth write" on public.gym_disciplines for all using (auth.role() = 'authenticated');

create policy "Public read" on public.gym_animateurs for select using (true);
create policy "Auth write" on public.gym_animateurs for all using (auth.role() = 'authenticated');

create policy "public read" on public.rando_page_blocks for select using (true);
create policy "auth write" on public.rando_page_blocks for all using (auth.role() = 'authenticated');

create policy "public read" on public.rando_jeudi_groupes for select using (true);
create policy "auth write" on public.rando_jeudi_groupes for all using (auth.role() = 'authenticated');

create policy "public read" on public.nordique_page_blocks for select using (true);
create policy "auth write" on public.nordique_page_blocks for all using (auth.role() = 'authenticated');

create policy "public read" on public.sante_page_blocks for select using (true);
create policy "auth write" on public.sante_page_blocks for all using (auth.role() = 'authenticated');

create policy "public read" on public.asso_page_blocks for select using (true);
create policy "auth write" on public.asso_page_blocks for all using (auth.role() = 'authenticated');

create policy "public read" on public.ag_documents for select using (true);
create policy "auth write" on public.ag_documents for all using (auth.role() = 'authenticated');

create policy "admin_profiles_select" on public.admin_profiles for select to authenticated
  using ((email = (auth.jwt() ->> 'email')) or (get_admin_role() = 'super_admin'));
create policy "admin_profiles_write" on public.admin_profiles for all to authenticated
  using (get_admin_role() = 'super_admin') with check (get_admin_role() = 'super_admin');

create policy "Public can submit contact messages" on public.contact_messages for insert to anon
  with check (source = 'site_web' and status = 'new' and length(prenom) between 1 and 80 and length(nom) between 1 and 80 and length(email) between 3 and 160 and length(message) between 1 and 3000);
create policy "Authenticated users can read contact messages" on public.contact_messages for select to authenticated using (true);

create policy "public_read" on public.vacances_scolaires for select using (true);
create policy "admin_write" on public.vacances_scolaires for all using (true) with check (true);

create policy "activity_log_select" on public.activity_log for select to authenticated using (true);
create policy "activity_log_insert" on public.activity_log for insert to authenticated with check (true);

create policy "tarifs_select_public" on public.tarifs for select using (true);
create policy "tarifs_insert_auth" on public.tarifs for insert to authenticated with check (true);
create policy "tarifs_update_auth" on public.tarifs for update to authenticated using (true);
create policy "tarifs_delete_auth" on public.tarifs for delete to authenticated using (true);

create policy "public_read_active_banners" on public.site_banners for select using (true);
create policy "admin_all_banners" on public.site_banners for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');


-- ----------------------------------------------------------------
-- 5. DONNÉES
-- ----------------------------------------------------------------

insert into public.gym_courses (id,jour,heure_debut,heure_fin,discipline,animateur,salle,niveau,actif,disc,created_at,complet,tag,recurrence) values
('c6d417a3-63bb-4c1d-8bfe-c6064a78dece','vendredi','10:00','11:00','Gym Sport Santé','Olivier','Marie France Faure','tous',true,'renfo','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('7272d216-09d0-4486-812a-a4065493c26e','vendredi','11:00','12:00','Pilates niveau 1','Olivier','Marie France Faure','tous',true,'pilates','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('3f1597a6-7379-419b-9c72-6509d892e66e','jeudi','10:00','11:00','RM doux – Sport Santé','Elisabeth','Dreyfus','tous',true,'renfo','2026-05-27 22:16:38.737997+00',false,'nouveau','{"type":"biweekly","refDate":"2026-05-28","interval":2}'),
('55277654-8224-4de5-ba97-bafded548bee','lundi','09:00','10:00','Gym équilibre','Marie-Do','Dreyfus','tous',true,'senior','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('ecc44f5b-bdd2-488f-8d97-9135d3a18e42','lundi','10:00','11:00','Gym senior','Marie-Do','Dreyfus','tous',true,'senior','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('4572c2b1-e81c-478b-8324-8adfaa9396b4','lundi','11:00','12:00','Senior entretien','Olivier','Dreyfus','tous',true,'senior','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('b43cc9d0-9a42-4224-9052-af896c14d5cb','lundi','12:00','13:00','RM/Stretching','Olivier','Dreyfus','tous',true,'renfo','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('6f3165e7-aab7-443a-b790-c27f5f2590ba','mardi','10:15','11:15','Pilates niveau 1','Olivier','Dreyfus','tous',true,'pilates','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('6a6805db-b802-4d8f-85b8-35ff777cdc62','mardi','11:15','12:15','Qi Gong','Elisabeth','Dreyfus','tous',true,'tendance','2026-05-27 22:16:38.737997+00',false,'nouveau','{"type":"weekly"}'),
('850425ce-8882-44d1-930b-3bbc67bf8355','mardi','16:30','17:30','APA – Sport sur Ordonnance','Elisabeth','Dreyfus','tous',true,'tendance','2026-05-27 22:16:38.737997+00',false,'apa','{"type":"weekly"}'),
('2dc89569-004d-4515-821b-b651c7096939','mardi','18:45','19:45','Yoga niveau 2','Catherine','Dreyfus','tous',true,'yoga','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('6ce0e2c9-f122-4762-be5d-5fada15972c7','mercredi','08:30','09:30','Stretching/RM','Colette','Dreyfus','tous',true,'renfo','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('b78e2b3c-ce65-46cf-9691-ee2982523d4f','mercredi','11:45','12:45','Pilates niveau 2','Olivier','Dreyfus','tous',true,'pilates','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('1f0ef39d-54fd-4354-925f-5b2c3b8ac9db','mercredi','12:45','13:45','Pilates niveau 1','Olivier','Dreyfus','tous',true,'pilates','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('6e4c5422-f1a4-4a37-a818-5f6dcdd20812','mercredi','18:00','19:00','Yoga niveau 1','Catherine','Dreyfus','tous',true,'yoga','2026-05-27 22:16:38.737997+00',false,'nouveau','{"type":"weekly"}'),
('5118849c-988f-4c09-9e83-04d1575b858e','mercredi','19:30','20:30','Pilates/Stretching','Olivier','Dreyfus','tous',true,'pilates','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('8e6262c4-524d-4025-a8c7-dac8506e65bd','vendredi','08:45','09:45','RM doux','Stéphanie','Dreyfus','tous',true,'renfo','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('19e75426-742b-4e4d-86ff-65a29a804369','vendredi','09:45','10:45','RM','Stéphanie','Dreyfus','tous',true,'renfo','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('a8b1705f-01b3-4898-8aa2-3b5e79ad28a7','vendredi','11:00','12:00','Gym équilibre','Marie-Do','Dreyfus','tous',true,'senior','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('ed31a5ad-b729-4a59-acbe-dc89aff1d72d','vendredi','12:15','13:15','Gym dynamique','Florence','Dreyfus','tous',true,'step','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('d9773062-e754-4956-845a-859eeae1ef50','lundi','09:00','10:00','Gym dynamique','Laurence','Louvière','tous',true,'step','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('526e04e5-3a7c-4799-9d9a-5118ae0a967f','lundi','10:00','11:00','Pilates niveau 2','Laurence','Louvière','tous',true,'pilates','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('68b0beed-05fd-42aa-b6fe-a5bac6f7a269','mardi','09:00','10:00','Barre au sol','Florence','Louvière','tous',true,'tendance','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('2254e300-5800-4678-88d4-e3defa4284fc','mardi','10:00','11:00','Gym dynamique','Florence','Louvière','tous',true,'step','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('8c0f3ca7-53d9-4915-be18-282e202b0b29','mardi','14:00','15:00','Gym douce','Florence','Louvière','tous',true,'low','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('f3e2af5a-9728-4195-94a5-e97443e96aaa','jeudi','09:00','10:00','Gym dynamique','Florence','Louvière','tous',true,'step','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('e43ffd13-335e-4c74-8bc0-24b9da124adb','jeudi','10:00','11:00','Gym douce','Florence','Louvière','tous',true,'low','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('1a4e6408-3bf6-49d8-87a8-aaa8e8744c85','lundi','08:30','09:30','Senior entretien','Olivier','La Ruche Clairière','tous',true,'senior','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('71e2d436-deaf-4f94-98f9-3489283257fd','lundi','09:30','10:30','RM','Olivier','La Ruche Clairière','tous',true,'renfo','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('da861d76-4c08-477b-8ef5-766746699e95','mardi','09:00','10:00','Stretching/RM','Colette','La Ruche Clairière','tous',true,'renfo','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('eff1f66a-1d5d-44bf-a766-3cf72b00fa04','mardi','10:00','11:00','Stretching/RM','Colette','La Ruche Clairière','tous',true,'renfo','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('c2324610-7a84-4c19-a299-5fb953b08341','mardi','11:00','12:00','Yoga niveau 1','Catherine','La Ruche Clairière','tous',true,'yoga','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('ff1fef7c-c982-4b07-ac20-9e5e374acc79','jeudi','19:00','20:00','Yoga niveau 2','Catherine','La Ruche Clairière','tous',true,'yoga','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('2a50224d-d9aa-4e2f-993c-cd1f8adbe26d','vendredi','09:00','10:00','Gym dynamique','Florence','La Ruche Clairière','tous',true,'step','2026-05-27 22:16:38.737997+00',true,null,'{"type":"weekly"}'),
('3ddbc212-7b8a-4d9f-b1ec-19f59c986b58','vendredi','10:00','11:00','Gym douce','Florence','La Ruche Clairière','tous',true,'low','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('802f2353-1f50-43a2-8fbe-fd7a3b95e899','vendredi','11:00','12:00','Gym douce','Florence','La Ruche Clairière','tous',true,'low','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('804740db-1bb8-4f01-b5f5-b1cb5de100dc','lundi','19:45','20:45','Cardio – Poundfit / HIIT / Tabata','Marie-Do','Catherine de Vivonne','tous',true,'pound','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('652955d8-0e07-43e1-9ef3-633d7893b733','mardi','20:30','21:30','Stretching/RM','Colette','Catherine de Vivonne','tous',true,'renfo','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('ba0ab334-03ef-4dd7-a61c-239b5f45ad1b','mercredi','20:00','21:00','TRX','Marie-Do','Catherine de Vivonne','tous',true,'renfo','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('592888e2-61a4-4d30-8d86-237f4ca58e30','samedi','09:30','10:30','Gym dynamique','Florence','La Ruche Clairière','tous',true,'step','2026-05-27 22:16:38.737997+00',false,null,'{"type":"biweekly","refDate":"2026-05-28","interval":2}'),
('58806052-8c74-45f7-98cd-941ed6ba4da0','lundi','09:30','10:30','Yoga doux','Catherine','Marie France Faure','tous',true,'yoga','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('36fae112-78ee-4bf5-a6bc-27cbdc82960c','lundi','10:30','11:30','Yoga doux','Catherine','Marie France Faure','tous',true,'yoga','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}'),
('5eadbc73-5cae-4a69-ace5-f29cb98fe8a5','jeudi','19:30','20:30','Cardio – Poundfit / HIIT / Tabata','Marie-Do','Catherine de Vivonne','tous',true,'pound','2026-05-27 22:16:38.737997+00',false,null,'{"type":"weekly"}');

insert into public.rando_sorties (id,date,type,titre,distance_km,denivele,groupes,point_depart,heure_depart,animateur,complet,annule,created_at) values
('57c26f43-d463-470c-b236-435d64de2036','2026-05-28','rando-jeudi','Foret de Rambouillet - Etangs de Hollande',12,180,array['Gr 2A','Gr 2B'],'Parking Leclerc','13:45','Jean-Pierre',false,false,'2026-05-26 12:19:59.520239+00'),
('d2d743bb-9e98-40bc-b6a0-8a92734e9a69','2026-05-31','rando-dimanche','Vallee de Chevreuse - Boucle des moulins',10,120,array['Tous'],'Parking Leclerc','09:00','Marie-Claire',false,false,'2026-05-26 12:19:59.520239+00'),
('ec2e7f99-b6c5-4698-b76e-31712de4c92c','2026-06-02','nordique-mardi','Marche nordique - Etang de la Tour',8,null,array['Tous'],'Parking Foret','14:00','Pierre',false,false,'2026-05-26 12:19:59.520239+00'),
('326be602-c707-4d5e-8c73-1df0865e1cb6','2026-06-04','rando-jeudi','Clairefontaine - Sentier des bornes',14,220,array['Gr 1'],'Parking Leclerc','13:30','Jean-Pierre',true,false,'2026-05-26 12:19:59.520239+00'),
('6fda0230-7464-4c14-bbd3-190cef61cc63','2026-06-06','nordique-samedi','Marche nordique - Bois des Hauts',7,null,array['Tous'],'Parking Foret','09:00','Pierre',false,false,'2026-05-26 12:19:59.520239+00'),
('346f15eb-bf93-4cc6-9f6b-fcb01e8ef5bd','2026-06-11','rando-jeudi','La Celle-les-Bordes - Boucle du Roi',11,150,array['Gr 2A','Gr 2B'],'Parking Leclerc','13:45','Sylviane',false,false,'2026-05-26 12:19:59.520239+00'),
('9fc534c7-0351-45f6-b934-3da838791cd4','2026-06-14','rando-jeudi','Saint-Leger - Sentier gros chene',9,100,array['Gr 3','Gr 4'],'Parking Nickel','13:45','Catherine',false,true,'2026-05-26 12:19:59.520239+00');

insert into public.actualites (id,cat,date,title,excerpt,created_at,image_url) values
('4539ea99-c230-401f-86f5-4973cd8e6312','nordique','2026-05-12','Marche nordique du 29 avril','Daniele animera une seance le mardi 29 avril. Rendez-vous a 14h au parking habituel.','2026-05-26 12:19:59.520239+00',null),
('00209ff5-441a-46a2-85dc-7c92a40d1d0f','rando','2026-05-08','Horaires d''ete','Groupe 1 : RDV 13h00 pour un depart a 13h15. Groupe 2A : RDV au parking Leclerc a 13h30.','2026-05-26 12:19:59.520239+00',null),
('f5b4562e-8c98-441c-bfab-27bce53f8b12','gym','2026-04-22','Planning 2026-2027 disponible','Le planning des cours de gym pour la saison 2026-2027 est disponible en telechargement.','2026-05-26 12:19:59.520239+00',null),
('ece8669c-77c0-40bb-9d29-fe5f0853e614','asso','2026-04-15','Label Rando-Sante obtenu','L''AGMR a obtenu le label Sante de la Federation Francaise de Randonnee.','2026-05-26 12:19:59.520239+00',null),
('adef1816-270c-484d-8023-eb068d5f5bae','event','2026-04-10','Forum des Associations','Le forum aura lieu le samedi 13 septembre au stade du Vieux Moulin.','2026-05-26 12:19:59.520239+00',null),
('1dbb6f06-d258-49e5-979e-8b95838ded6b','rando','2026-05-15','Sejour Bretagne ','Les personnes inscrites au sejour Cote de granit rose doivent acquitter avant le 15 avril 2026 le solde de leur participation.','2026-05-26 12:19:59.520239+00',null);

insert into public.sejours (id,titre,dates,transport,statut,description,img,created_at,image_url) values
('c579ca7d-3521-4605-8744-fb49a6b3b7c0','Decouverte en baie du Mont-Saint-Michel','12 - 18 septembre 2026','Car','ouvert','Traversee de la baie a pied, abbaye, randonnees cotieres.','c','2026-05-26 12:19:59.520239+00',null),
('a50c965e-bbed-46e7-b689-dd1f24e176fc','Alsace','14 - 21 mai 2026','Car','ouvert','Strasbourg, route des vins, randonnees dans les Vosges.','a','2026-05-26 12:19:59.520239+00',null),
('5c914043-0f37-4664-98a2-08545b64e433','Tour du Mont-Blanc','5 mai 2026','Voiture','passe','Faites le tour du Mont-Blanc avec un guide chevronné','d','2026-05-28 09:03:40.315994+00',null),
('591142da-0c28-4ddd-bb3b-c8b15bac275c','Bretagne - Cote de granit rose','02 - 04 juin 2026','Covoiturage','ouvert','Sentier des douaniers, Ploumanach, Perros-Guirec.','b','2026-05-26 12:19:59.520239+00',null);

insert into public.bureau (id,nom,role,ordre,created_at,photo_url,groupe) values
('0bec8d25-7edc-4b91-a9f2-4abf9ed2f145','Neil BROWN','Président',1,'2026-05-27 21:44:47.846132+00',null,'Bureau exécutif'),
('4c6b96a2-2507-4886-9296-c04f90c1e4b2','Nathalie VILLIERS','Trésorière',2,'2026-05-27 21:44:47.846132+00',null,'Bureau exécutif'),
('3709d18c-021e-4ff5-b2df-5a6a00e28777','Anne-Lise GIROUX','Secrétaire',3,'2026-05-27 21:44:47.846132+00',null,'Bureau exécutif'),
('11bc7784-25a8-4ca8-a9ce-23d34be987b1','Micheline BROWN','Responsable Gym',4,'2026-05-27 21:44:47.846132+00',null,'Responsables d''activités'),
('f45465e1-6d6b-4208-8158-b91b46445aac','Gérard BONDOUX','Responsable Marche',5,'2026-05-27 21:44:47.846132+00',null,'Responsables d''activités'),
('5f484740-a12f-4582-b6d2-eeb0e1174b5d','Gérard BAUDOUIN','Webmaster',6,'2026-05-27 21:44:47.846132+00',null,'Membres du bureau'),
('6a22b542-6fd3-4b62-bae2-e54a9ea96c99','Catherine SAMSON','Trésorière adjointe',7,'2026-05-27 21:44:47.846132+00',null,'Membres du bureau'),
('f8b32d26-9824-4e57-b8d7-a7603dd0eccc','Bernard LAURENT','Chargé de mission',8,'2026-05-27 21:44:47.846132+00',null,'Membres du bureau'),
('0c2a18c7-784f-4151-95eb-b33d6f76ed1f','Elisabeth GIRONA','Secrétaire adjointe',9,'2026-05-27 21:44:47.846132+00',null,'Membres du bureau');

insert into public.site_stats (id,section,valeur,label,ordre,created_at) values
('0086b83d-e65f-4917-927d-f400f72a9e83','hero','3','Disciplines',3,'2026-05-27 08:25:42.913853+00'),
('d67ca298-9d61-48c4-a7ff-cbfb53c38da2','band','43h','de cours de gym chaque semaine',2,'2026-05-27 08:25:42.913853+00'),
('1e04693a-4e38-4153-a461-f4d9ee927552','band','5','salles municipales partenaires',4,'2026-05-27 08:25:42.913853+00'),
('241f0b35-ec65-47cd-bbf5-9707f4e7784d','hero','800','Adhérents',1,'2026-05-27 08:25:42.913853+00'),
('83b09c2a-1316-40cc-b51d-85ad4e519d99','hero','54','Années',2,'2026-05-27 08:25:42.913853+00'),
('545cf7a1-1f18-4893-bf6b-d8507be76583','band','800','Adhérents en 2025-2026',1,'2026-05-27 08:25:42.913853+00'),
('1731275a-a59a-4ace-9157-3d3cca4b09d3','band','25','animateurs bénévoles randonnée',3,'2026-05-27 08:25:42.913853+00');

insert into public.home_blocks (id,block_key,label,visible,content,ordre,created_at) values
('048659fa-af89-466d-8763-d3bce6972130','trio_nordique','Carte Marche nordique',true,'{"cta":"En savoir plus","tag":"Plein air","lien":"/activites/nordique","stat":"Batons pretes","titre":"La Marche nordique","photo_url":"","description":"Plus dynamique que la randonnee, avec deux batons pour engager tout le corps. Mardi, samedi."}',40,'2026-05-27 09:33:06.236941+00'),
('b973c57e-74ea-4292-b0d5-019ff9db976c','manifesto','Section Philosophie',true,'{"pull":"Une seule adhesion, trois facons de prendre soin de soi.","badge":"L''epanouissement avant la performance","texte":"L''AGMR est une association loi 1901 fondee en 1970. Trois manieres de bouger, toutes pratiquees dans un esprit de detente et de convivialite, en dehors de toute notion de competition.","titre":"Le plaisir d''abord,\nle reste suit.","eyebrow":"Notre philosophie","cta1_lien":"/association","cta2_lien":"/inscriptions","badge_meta":"Charte AGMR — 2018","cta1_texte":"L''association","cta2_texte":"S''inscrire"}',50,'2026-05-27 09:33:06.236941+00'),
('efcb8d0b-f8be-4d58-9d0c-0adea936d6a0','actualites','Section Actualités',true,'{"nb_articles":4}',60,'2026-05-27 09:33:06.236941+00'),
('329efd40-6dbf-4e9a-9f0e-e7cda99732b0','cta_banner','Bandeau CTA',true,'{"titre":"Première séance d''essai gratuite.","cta1_lien":"/inscriptions","cta2_lien":"/contact","cta1_texte":"S''inscrire","cta2_texte":"Nous contacter","sous_titre":"Sur simple inscription par téléphone ou en ligne. Aucun engagement."}',70,'2026-05-27 09:33:06.236941+00'),
('9f381d16-fcf8-4f3b-9d6d-51cdbfc5e579','stats_band','Bandeau de statistiques',true,'{}',55,'2026-05-30 20:28:51.056077+00'),
('48cf4d3c-0f74-44ca-806a-09c2dc13aa9b','hero','Hero',true,'{"eyebrow":"Depuis 1970 · Rambouillet","cta1_lien":"/inscriptions","cta2_lien":"/activites/gym","photo_url":"https://suebmlnnyuusjdvokxur.supabase.co/storage/v1/object/public/galerie/home/1780088793799-vzafispeemq.webp","cta1_texte":"Je m''inscris","cta2_texte":"Decouvrir nos activites","sous_titre":"Gymnastique, randonnée, marche nordique.\nDans un esprit de détente et de convivialité.","titre_ligne1":"Bougez, marchez,","titre_ligne2":"respirez ensemble."}',10,'2026-05-27 09:33:06.236941+00'),
('c0f44435-0eb4-49f0-8e54-8b55009bd7fb','trio_gym','Carte Gym',true,'{"cta":"Voir les cours","tag":"Salle","lien":"/activites/gym","stat":"43h / semaine","titre":"La Gym","photo_url":"","description":"Pilates, Yoga, Stretching, Barre au sol, Fitball... 10 disciplines, 8 animateurs brevetes, 5 salles municipales."}',20,'2026-05-27 09:33:06.236941+00'),
('2860e0d4-1d0d-4c05-809a-21c0f31ffdf2','trio_rando','Carte Randonnée',true,'{"cta":"Voir les sorties","tag":"Foret","lien":"/activites/randonnee","stat":"5 niveaux","titre":"La Randonnee","photo_url":"","description":"5 groupes de niveau, 5 a 14 km, chaque jeudi apres-midi. Sorties dimanche tous les 15 jours."}',30,'2026-05-27 09:33:06.236941+00');

insert into public.gym_page_blocks (id,block_key,label,visible,content,ordre) values
('ca349cf4-9892-4fe1-8884-f47151ab6ff1','programme','Encart Programme',true,'{"note":"Chaque cours couvre la saison complète, soit environ 34 séances.","intro":"Vous pouvez assister à 2 ou 3 heures de cours par semaine. L''adhésion vous permet de choisir, parmi les cours proposés, au maximum :","titre":"Construisez votre propre programme","bullets":"3 cours de gym\n+ 2 cours de yoga / Qi Gong\n+ 2 cours de Pilates","cta1_lien":"/planning/gym","cta2_lien":"/inscriptions","cta1_texte":"Voir le planning","cta2_texte":"S''inscrire"}',3),
('05bb4fb7-06ab-4949-962b-f6cfff2e4972','prescri','Encart Prescri''Forme',true,'{"texte":"L''Association est agréée pour dispenser des cours de gym volontaire sur prescription médicale (dispositif Prescri''Forme, Île-de-France, depuis septembre 2019).","titre":"Prescri''Forme — sport sur ordonnance","cta_lien":"/activites/sante","cta_texte":"En savoir plus"}',4),
('975bddf7-4c65-4c22-a345-0a3448148431','header','En-tête de page',true,'{"lede":"43 heures de cours par semaine, 8 animateurs brevetés professionnels, 5 salles municipales. Construisez votre propre programme.","titre":"La Gym","eyebrow":"Activités · FFEPGV · Label Qualité Club Sport Santé"}',2),
('d3582816-15c7-423d-b531-5e0d50c0867b','intro','Introduction',true,'{"para1":"Notre section est affiliée à la Fédération Française d''Éducation Physique et de Gymnastique Volontaire (FFEPGV). Elle bénéficie du label Qualité Club Sport Santé.","para2":"Tous les cours sont donnés par des animateurs brevetés d''État. Ils proposent 43 heures de cours par semaine, d''une grande variété, répartis dans 5 salles mises à disposition par la municipalité.","titre":"La Gymnastique Volontaire à Rambouillet"}',1);

insert into public.gym_disciplines (id,mark,nom,description,ordre,visible) values
('31d393c5-e6f3-4552-af7f-e1457e4b4421','G','Gym','Gym générale, cardio, coordination.',1,true),
('67751e53-7ee3-4bab-bd5c-0e702b65f406','B','Barre au sol','Inspirée de la danse classique, travail de souplesse et de tonicité.',2,true),
('3e715931-090b-41cd-9d62-2b7bc41c658f','F','Fitball','Équilibre et gainage avec un ballon.',3,true),
('52467963-3745-4c71-97bf-ccb19511c36c','G','Gym équilibre senior','Prévention des chutes, coordination, mobilité articulaire.',4,true),
('7a8823d9-1abc-46b9-81a1-655eeb9ceb09','G','Gym senior','Maintien de la forme adapté aux seniors.',5,true),
('5eeee916-f8df-49a9-8551-a8c1b6971b13','G','Gym tendance','Cours dynamiques reflétant les nouvelles tendances.',6,true),
('873c8d77-3ac1-467b-a59a-62c5492acf46','P','Pilates','Renforcement musculaire profond, posture, respiration.',7,true),
('49d5c70f-daf9-479e-a22b-879f775c8a81','P','Poundfit','Fitness rythmé avec des baguettes légères.',8,true),
('71eecb21-198a-4571-84d3-54f2eff6a8f8','S','Stretching','Étirements, souplesse, récupération.',9,true),
('0fc08bf6-700a-4478-a1fb-a553a1011ded','Y','Yoga & Qi Gong','Postures, respiration, relaxation, méditation active.',10,true);

insert into public.gym_animateurs (id,nom,role,disciplines,photo_url,ordre,visible) values
('2cea56ee-be48-4254-9846-76d64c6147f1','Virginie','Animatrice gym','Pilates, Stretching',null,1,true),
('6fabedc6-b9e6-4569-baba-d2803280bb68','Cathy','Animatrice gym','Yoga, Barre au sol',null,2,true),
('2f9b083d-b2c8-4a0b-9e94-ce41e81fb66b','Martin','Animateur gym','Renforcement, Step, Low impact',null,3,true),
('e4469910-ef38-4fcc-a60f-cdfc2ddc005b','Sylvie','Animatrice gym','Gym équilibre, Fitball',null,4,true),
('af624c98-fcee-47bb-9c48-0fe2009d6acf','Anne','Animatrice gym','Yoga senior, Poundfit',null,5,true),
('d6eef5a8-a26b-4c8b-8d5f-d3ec1503cedc','Lea','Animatrice gym','Gym tendance',null,6,true);

insert into public.rando_page_blocks (id,block_key,label,visible,content,ordre) values
('bbea717c-9543-4632-90df-69ff21425556','header','En-tête de page',true,'{}',1),
('b9cdd05a-a027-4ca5-a4aa-85f3fea62696','intro','Introduction',true,'{}',2),
('31c5cb14-2705-415a-ab33-e77d779098b9','jeudi','Randonnées du jeudi',true,'{}',3),
('df97ea0a-919e-4780-ba8b-4e2a33fa73fc','dimanche','Randonnées du dimanche',true,'{}',4),
('ef9140ce-978d-4b4c-872a-e2d9f13f1eb4','sejours','Sorties & séjours',true,'{}',5),
('fd1080fb-59ac-4a76-a2ce-9814aa8e86c4','temoignage','Témoignage',true,'{}',6),
('fe901ee8-6bb9-4b53-96b4-a5b9a8c36eca','sante','Rando-Santé',true,'{}',7);

insert into public.rando_jeudi_groupes (id,groupe,distance,retour,rdv,ordre) values
('feaa1670-cfca-4573-beb6-2369d4783d84','Groupe 1','12 à 14 km','17h30','Parking Leclerc',1),
('c010e6e8-6e45-44ca-a04f-6d2adcd3dc50','Groupe 2A','10 à 12 km','17h00','Parking Leclerc',2),
('fb5ed229-54a4-42a4-ab5b-79cdd38a9e09','Groupe 2B','8 à 10 km','16h30','Parking Leclerc',3),
('b854f256-9c55-4784-a22d-e8a9917b8d46','Groupe 3','7 à 9 km','16h30','Parking Nickel',4),
('27e3df8f-4f5f-4bf4-82cf-efced0116118','Groupe 4','5 à 7 km','16h30','Parking Nickel',5);

insert into public.nordique_page_blocks (id,block_key,label,visible,content,ordre) values
('cc5d0fb6-f5a0-4b31-928a-0eae02c42f46','quand','Quand pratiquer',true,'{}',4),
('6fa2d9ce-8458-4615-a6ba-3bb8cc48652b','header','En-tête de page',true,'{}',1),
('8433a087-bd38-4ee6-8fe0-5d83974a6dbc','intro','Introduction',true,'{}',2),
('e2755ad8-b605-4d08-9b13-117f5eab9d70','seance','Déroulé d''une séance',true,'{}',3);

insert into public.sante_page_blocks (id,block_key,label,visible,content,ordre) values
('495e61ce-9f18-420f-b123-ae6b7304aa8d','header','En-tête de page',true,'{}',1),
('cb071c6e-326d-47af-8416-859eeaf659e0','prescri','Prescri''Forme',true,'{}',2),
('ab203a8f-fc6d-4737-b665-98df056849ae','rando_sante','Rando-Santé',true,'{}',3),
('a31a8bc9-74b4-4c10-806a-3a4dab82f52f','temoignage','Témoignage',true,'{}',4);

insert into public.asso_page_blocks (id,block_key,label,visible,content,ordre) values
('ab2a7644-2146-44ac-b122-ae24164b960a','header','En-tête de page',true,'{}',1),
('b58e19b5-a363-419d-ac09-209ccd892be2','sections','Les sections',true,'{}',3),
('ff06619d-e12e-4681-86c2-e974af54b333','gouvernance','Gouvernance',true,'{}',4),
('4fe61106-ed23-45bd-8435-5a6b84a515c7','affiliations','Affiliations & labels',true,'{}',5),
('ced7413a-416c-441b-afca-dee887a62754','documents_asso','Documents officiels',true,'{}',6),
('d47cfe04-59d8-4338-b888-d6ac3a6e59af','histoire','Notre histoire',true,'{}',2);

insert into public.ag_documents (id,saison,titre,url,ordre) values
('287c6f40-d100-454b-b173-b69867823120','2024-2025','Convocation AG 2025','#',1),
('8f7a4078-b688-45c1-83ec-a2a9fc8409e0','2024-2025','PV AG ordinaire 2025','#',2),
('f3df2e65-bba4-4b29-94b2-5f2723c35b06','2024-2025','Rapport moral 2025','#',3),
('a323bf57-239b-4600-b2f3-df2540942331','2024-2025','Rapport financier 2025','#',4),
('ffae6d7b-ef99-4878-8466-c5453a80984c','2023-2024','PV AG ordinaire 2024','#',1),
('242d2330-a2ac-4795-a106-24477036087a','2023-2024','Rapport moral 2024','#',2);

insert into public.admin_profiles (id,email,display_name,role,permissions,created_at) values
('2211617a-6cb6-4ef5-b2cb-a489c789be37','tho.chevalier@gmail.com','Thomas','super_admin','{}','2026-05-27 20:36:43.948112+00'),
('663575ef-eb66-486d-bdd4-ba76278a1ef4','agmrmailer@gmail.com','Admin Test','super_admin','{}','2026-05-30 06:43:55.201842+00');

insert into public.vacances_scolaires (id,nom,date_debut,date_fin,zone,created_at) values
('f5b71131-8193-4a62-9c18-ce778205729d','Toussaint 2025','2025-10-18','2025-11-02','C','2026-05-28 08:04:30.917193+00'),
('9d3b6f0f-9998-467e-b487-94ccad1232c4','Noël 2025-2026','2025-12-20','2026-01-04','C','2026-05-28 08:04:30.917193+00'),
('3f4dd77e-2232-4b4a-ad38-feb2d398ea0c','Hiver 2026','2026-02-07','2026-02-22','C','2026-05-28 08:04:30.917193+00'),
('f4ee7f15-2e32-4456-93bd-00aeabcaffd2','Printemps 2026','2026-04-11','2026-04-27','C','2026-05-28 08:04:30.917193+00'),
('444cfd46-5e53-4ad1-8fbf-6b363867be7e','Été 2026','2026-07-05','2026-08-31','C','2026-05-28 08:04:30.917193+00');

insert into public.tarifs (id,categorie,label,valeur,ordre,note) values
('ba22ccfc-80e0-4bc4-b832-ca2c36aff39c','gym','Licence FFEPGV','',2,null),
('80a20d66-e4a6-41c6-bbe8-9f07c5b6c908','gym','1 cours gym / semaine','',3,null),
('a6d79328-3ae8-4712-82db-1531da7d8cdd','gym','+ Pilates (par cours)','',4,null),
('3b4322d4-be5d-42f2-b023-63425c8976a7','gym','+ Yoga / Qi Gong (par cours)','',5,null),
('0460fbdc-8a97-40ff-9829-99cf60bbfb9f','marche','Adhésion association','',1,null),
('ffad9cfe-21a2-4456-9437-6755a96cc15a','marche','Licence FFRP','',2,null),
('74c06d9b-c6cb-4689-a190-9af49918d5a4','marche','Cotisation marche','',3,null),
('6a1f7005-8104-4249-a7a3-c0b9424dabfc','gym','Adhésion association','32 €',1,null),
('ab18018d-391c-4b71-86f9-8480d95c8300','__meta__','__page_config__','',0,'{"saison":"2026 - 2027","eyebrow":"","lede":""}');

insert into public.site_banners (id,message,type,active,lien,lien_texte,created_at,expires_at) values
('04ec06ff-f0cc-4a09-85fa-d2eb9e597fef','Les randonnées sont annulées en raison de la météo','warning',true,null,null,'2026-05-30 14:54:01.456861+00',null);

insert into public.activity_log (id,created_at,message,user_email,section,action) values
('b6b0c7b6-742a-4504-adc7-9b921272c9ae','2026-05-28 09:23:55.475478+00','Séjour rouvert — Alsace','tho.chevalier@gmail.com','sejours','update'),
('f787ceb9-05e1-4350-8e33-6af0dd0cec22','2026-05-28 09:24:05.378931+00','Séjour terminé — Tour du Mont-Blanc','tho.chevalier@gmail.com','sejours','update'),
('c3fe2609-fe77-46e8-b57d-d92a4897d8ac','2026-05-29 15:31:31.898396+00','Article modifié — Sejour Bretagne ','tho.chevalier@gmail.com','actu','update'),
('d3cc5642-42f1-40f5-80e1-7fe0d9ae3e20','2026-05-29 15:34:48.816458+00','Séjour modifié — Bretagne - Cote de granit rose','tho.chevalier@gmail.com','sejours','update'),
('a34521ff-ec1c-43d1-96f1-b32611a22da7','2026-05-29 15:35:43.648278+00','Séjour modifié — Bretagne - Cote de granit rose','tho.chevalier@gmail.com','sejours','update'),
('8aaa9741-1958-4088-b394-5f1fe6a5b00b','2026-05-29 15:37:20.411207+00','Sortie supprimée — rando-jeudi du 2026-05-26','tho.chevalier@gmail.com','rando','delete'),
('816e34ff-4406-4cda-9743-4cb7d43a433e','2026-05-29 20:10:41.133939+00','Article modifié — Sejour Bretagne ','tho.chevalier@gmail.com','actu','update');
