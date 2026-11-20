import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from './supabase-server'

export const EDIT_COOKIE = 'agmr_edit'

// Mode « édition visuelle » : cookie activé depuis l'admin ET administrateur connecté.
// Renvoie l'administrateur ({ email, isSuperAdmin, permissions }) ou null.
// Mis en cache pour la durée de la requête (un seul appel Supabase par page).
export const getEditMode = cache(async () => {
  const store = await cookies()
  if (store.get(EDIT_COOKIE)?.value !== '1') return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('role, permissions')
      .ilike('email', user.email)
      .maybeSingle()
    if (!profile) return null
    return {
      email: user.email,
      isSuperAdmin: profile.role === 'super_admin',
      permissions: profile.permissions ?? [],
    }
  } catch {
    return null
  }
})
