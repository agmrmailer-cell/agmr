import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

const MASTER_EMAIL = 'tho.chevalier@gmail.com'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', status: 401 }
  const { data: profile } = await supabase
    .from('admin_profiles').select('role').eq('email', user.email).maybeSingle()
  if (profile?.role !== 'super_admin') return { error: 'Accès refusé', status: 403 }
  return { user }
}

// POST — créer un compte admin (ancien /api/admin/invite)
export async function POST(req) {
  const auth = await checkSuperAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { email, display_name, role, permissions, password } = await req.json()
  if (!email?.trim())      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  if (!password?.trim())   return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Mot de passe trop court (8 car. min)' }, { status: 400 })

  const admin = createAdminClient()
  const { error: createErr } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  })
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })

  const { error: profileErr } = await admin.from('admin_profiles').upsert({
    email:        email.trim().toLowerCase(),
    display_name: display_name?.trim() || null,
    role:         role ?? 'admin',
    permissions:  role === 'super_admin' ? [] : (permissions ?? []),
  }, { onConflict: 'email' })
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// PATCH — reset password (ancien /api/admin/reset-password)
export async function PATCH(req) {
  const auth = await checkSuperAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { targetEmail, newPassword } = await req.json()
  if (!targetEmail || !newPassword)
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  if (newPassword.length < 8)
    return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum)' }, { status: 400 })

  const admin = createAdminClient()
  const { data: targetProfile } = await admin
    .from('admin_profiles').select('role').eq('email', targetEmail).maybeSingle()
  if (targetProfile?.role === 'super_admin')
    return NextResponse.json({ error: "Impossible de modifier le mot de passe d'un super admin" }, { status: 403 })

  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const target = users.find(u => u.email === targetEmail.toLowerCase())
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const { error: updateErr } = await admin.auth.admin.updateUserById(target.id, { password: newPassword })
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE — supprimer un compte admin (ancien /api/admin/delete-user)
export async function DELETE(req) {
  const auth = await checkSuperAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { targetEmail } = await req.json()
  if (!targetEmail) return NextResponse.json({ error: 'Email cible requis' }, { status: 400 })

  const admin = createAdminClient()
  const { data: targetProfile } = await admin
    .from('admin_profiles').select('role').eq('email', targetEmail).maybeSingle()

  if (targetProfile?.role === 'super_admin' && auth.user.email !== MASTER_EMAIL)
    return NextResponse.json({ error: 'Impossible de supprimer un super administrateur.' }, { status: 403 })

  await admin.from('admin_profiles').delete().eq('email', targetEmail)

  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const authUser = users.find(u => u.email === targetEmail.toLowerCase())
  if (authUser) {
    const { error: delErr } = await admin.auth.admin.deleteUser(authUser.id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
