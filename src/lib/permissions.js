// Correspondance table Supabase → sections du back-office autorisées à la modifier.
// Doit rester synchronisée avec supabase/droits_par_section.sql (c'est la base qui fait foi).
export const TABLE_PERMISSIONS = {
  home_blocks: ['home'],
  site_stats: ['home'],
  gym_page_blocks: ['gym-page'],
  gym_disciplines: ['gym-page'],
  gym_animateurs: ['gym-page', 'comite'],
  gym_courses: ['gym'],
  vacances_scolaires: ['gym'],
  rando_page_blocks: ['rando-page'],
  nordique_page_blocks: ['rando-page'],
  rando_jeudi_groupes: ['rando-page'],
  rando_sorties: ['planning-rando-page'],
  planning_rando_page_blocks: ['planning-rando-page'],
  sante_page_blocks: ['sante-page'],
  asso_page_blocks: ['asso-page'],
  actualites: ['actu'],
  sejours: ['sejours'],
  galerie_photos: ['galerie'],
  ag_documents: ['ag'],
  bureau: ['comite'],
  tarifs: ['tarifs'],
  external_links: ['links', 'planning-rando-page'],
}

// Section dont dépend un texte de site_texts (clé "<page>.<champ>")
export function siteTextPermission(key) {
  const page = String(key).split('.')[0]
  if (page === 'home') return 'home'
  if (page === 'planning-rando') return 'planning-rando-page'
  return 'site-texts'
}

// ctx : { isSuperAdmin, permissions[] } — l'administrateur connecté
export function hasAnyPermission(ctx, perms) {
  if (!ctx) return false
  if (ctx.isSuperAdmin) return true
  return perms.some(p => ctx.permissions.includes(p))
}

export function canEditTable(ctx, table) {
  return hasAnyPermission(ctx, TABLE_PERMISSIONS[table] ?? [])
}

// Peut-on modifier l'emplacement décrit par un descripteur d'édition (voir editable-src.js) ?
export function canEditSrc(ctx, src) {
  if (!ctx || !src) return false
  if (src.kind === 'text') return hasAnyPermission(ctx, [siteTextPermission(src.key)])
  return canEditTable(ctx, src.table)
}
