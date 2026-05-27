import { supabase } from './supabase'

export async function getGymCourses() {
  const { data, error } = await supabase
    .from('gym_courses')
    .select('*')
    .eq('actif', true)
    .order('jour')
  if (error) { console.error(error); return [] }
  return data.map(c => ({
    id: c.id,
    jour: c.jour,
    heureDebut: c.heure_debut,
    heureFin: c.heure_fin,
    discipline: c.discipline,
    animateur: c.animateur,
    salle: c.salle,
    niveau: c.niveau,
    actif: c.actif,
    disc: c.disc,
  }))
}

export async function getRandoSorties() {
  const { data, error } = await supabase
    .from('rando_sorties')
    .select('*')
    .order('date')
  if (error) { console.error(error); return [] }
  return data.map(s => ({
    id: s.id,
    date: s.date,
    type: s.type,
    titre: s.titre,
    distanceKm: s.distance_km,
    denivele: s.denivele,
    groupes: s.groupes || [],
    pointDepart: s.point_depart,
    heureDepart: s.heure_depart,
    animateur: s.animateur,
    complet: s.complet,
    annule: s.annule,
  }))
}

export async function getActualites() {
  const { data, error } = await supabase
    .from('actualites')
    .select('*')
    .order('date', { ascending: false })
  if (error) { console.error(error); return [] }
  return data.map(n => ({
    id: n.id,
    cat: n.cat,
    date: n.date,
    title: n.title,
    excerpt: n.excerpt,
  }))
}

export async function getSejours() {
  const { data, error } = await supabase
    .from('sejours')
    .select('*')
    .order('created_at')
  if (error) { console.error(error); return [] }
  return data.map(s => ({
    id: s.id,
    titre: s.titre,
    dates: s.dates,
    transport: s.transport,
    statut: s.statut,
    description: s.description,
    img: s.img,
  }))
}

export async function getBureau() {
  const { data, error } = await supabase
    .from('bureau')
    .select('*')
    .order('ordre')
  if (error) { console.error(error); return [] }
  return data.map(b => ({
    id: b.id,
    nom: b.nom,
    role: b.role,
  }))
}

// ── Gym courses CRUD ──────────────────────────────────────────
export async function createGymCourse(data) {
  const { data: result, error } = await supabase
    .from('gym_courses')
    .insert({
      jour: data.jour,
      heure_debut: data.heureDebut,
      heure_fin: data.heureFin,
      discipline: data.discipline,
      animateur: data.animateur,
      salle: data.salle,
      niveau: data.niveau,
      actif: data.actif,
      disc: data.disc,
    })
    .select()
    .single()
  if (error) { console.error(error); return null }
  return result
}

export async function updateGymCourse(id, data) {
  const { error } = await supabase
    .from('gym_courses')
    .update({
      jour: data.jour,
      heure_debut: data.heureDebut,
      heure_fin: data.heureFin,
      discipline: data.discipline,
      animateur: data.animateur,
      salle: data.salle,
      niveau: data.niveau,
      actif: data.actif,
      disc: data.disc,
    })
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function deleteGymCourse(id) {
  const { error } = await supabase
    .from('gym_courses')
    .delete()
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ── Rando sorties CRUD ────────────────────────────────────────
export async function createRandoSortie(data) {
  const { data: result, error } = await supabase
    .from('rando_sorties')
    .insert({
      date: data.date,
      type: data.type,
      titre: data.titre,
      distance_km: data.distanceKm || null,
      denivele: data.denivele || null,
      groupes: data.groupes,
      point_depart: data.pointDepart,
      heure_depart: data.heureDepart,
      animateur: data.animateur,
      complet: data.complet,
      annule: data.annule,
    })
    .select()
    .single()
  if (error) { console.error(error); return null }
  return result
}

export async function updateRandoSortie(id, data) {
  const { error } = await supabase
    .from('rando_sorties')
    .update({
      date: data.date,
      type: data.type,
      titre: data.titre,
      distance_km: data.distanceKm || null,
      denivele: data.denivele || null,
      groupes: data.groupes,
      point_depart: data.pointDepart,
      heure_depart: data.heureDepart,
      animateur: data.animateur,
      complet: data.complet,
      annule: data.annule,
    })
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function deleteRandoSortie(id) {
  const { error } = await supabase
    .from('rando_sorties')
    .delete()
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ── Actualités CRUD ───────────────────────────────────────────
export async function createActualite(data) {
  const { data: result, error } = await supabase
    .from('actualites')
    .insert({
      cat: data.cat,
      date: data.date,
      title: data.title,
      excerpt: data.excerpt,
    })
    .select()
    .single()
  if (error) { console.error(error); return null }
  return result
}

export async function updateActualite(id, data) {
  const { error } = await supabase
    .from('actualites')
    .update({
      cat: data.cat,
      date: data.date,
      title: data.title,
      excerpt: data.excerpt,
    })
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function deleteActualite(id) {
  const { error } = await supabase
    .from('actualites')
    .delete()
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}


export async function getHomeBlocks() {
  const { data, error } = await supabase
    .from('home_blocks')
    .select('*')
    .order('ordre')
  if (error) { console.error(error); return [] }
  return data
}

export async function updateHomeBlock(key, content) {
  const { error } = await supabase
    .from('home_blocks')
    .update({ content })
    .eq('block_key', key)
  if (error) { console.error(error); return false }
  return true
}

export async function setHomeBlockVisible(key, visible) {
  const { error } = await supabase
    .from('home_blocks')
    .update({ visible })
    .eq('block_key', key)
  if (error) { console.error(error); return false }
  return true
}

export async function getSiteStats() {
  const { data, error } = await supabase
    .from('site_stats')
    .select('*')
    .order('ordre')
  if (error) { console.error(error); return { hero: [], band: [] } }
  return {
    hero: data.filter(s => s.section === 'hero').map(s => [s.valeur, s.label, s.id]),
    band: data.filter(s => s.section === 'band').map(s => [s.valeur, s.label, s.id]),
  }
}

export async function updateSiteStat(id, valeur, label) {
  const { error } = await supabase
    .from('site_stats')
    .update({ valeur, label })
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ── Rando page blocks ────────────────────────────────────────
export async function getRandoPageBlocks() {
  const { data, error } = await supabase
    .from('rando_page_blocks')
    .select('*')
    .order('ordre')
  if (error) { console.error(error); return [] }
  return data
}

// ── Rando jeudi groupes ──────────────────────────────────────
export async function getRandoJeudiGroupes() {
  const { data, error } = await supabase
    .from('rando_jeudi_groupes')
    .select('*')
    .order('ordre')
  if (error) { console.error(error); return [] }
  return data
}

// ── Gym page blocks ──────────────────────────────────────────
export async function getGymPageBlocks() {
  const { data, error } = await supabase
    .from('gym_page_blocks')
    .select('*')
    .order('ordre')
  if (error) { console.error(error); return [] }
  return data
}

// ── Gym disciplines (public — visible only) ──────────────────
export async function getGymDisciplines() {
  const { data, error } = await supabase
    .from('gym_disciplines')
    .select('*')
    .eq('visible', true)
    .order('ordre')
  if (error) { console.error(error); return [] }
  return data
}

// ── Gym animateurs (public — visible only) ───────────────────
export async function getGymAnimateurs() {
  const { data, error } = await supabase
    .from('gym_animateurs')
    .select('*')
    .eq('visible', true)
    .order('ordre')
  if (error) { console.error(error); return [] }
  return data
}

export async function getGaleriePhotos() {
  const { data, error } = await supabase
    .from('galerie_photos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data
}
