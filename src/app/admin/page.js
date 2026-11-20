import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AdminApp from './AdminApp'
import { sectionFromSlug } from './admin-url'

export const metadata = { title: "Administration — AGMR" }

export default async function AdminPage({ searchParams }) {
  const { section } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  // Charge le profil admin (rôle + permissions)
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('email', user.email)
    .single()

  // Pas de profil = accès refusé
  if (!profile) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", fontFamily: "sans-serif", color: "#333" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Accès non autorisé</h1>
          <p style={{ color: "#666" }}>Votre compte ({user.email}) n'a pas accès à l'administration.</p>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Contactez le super-administrateur.</p>
        </div>
      </div>
    )
  }

  return <AdminApp user={user} profile={profile} initialSection={sectionFromSlug(typeof section === 'string' ? section : '')}/>
}
