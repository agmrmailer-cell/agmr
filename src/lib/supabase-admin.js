import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé service_role.
 * À utiliser UNIQUEMENT côté serveur (API routes, Server Actions).
 * Ne jamais importer dans un composant client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
