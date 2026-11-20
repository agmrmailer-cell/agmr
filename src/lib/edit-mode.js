import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from './supabase-server'

export const EDIT_COOKIE = 'agmr_edit'

// Mode « édition visuelle » : cookie activé depuis l'admin ET administrateur connecté.
// Mis en cache pour la durée de la requête (un seul appel Supabase par page).
export const getEditMode = cache(async () => {
  const store = await cookies()
  if (store.get(EDIT_COOKIE)?.value !== '1') return false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
})
