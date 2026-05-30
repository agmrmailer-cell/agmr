import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('admin_profiles').select('role').eq('email', user.email).maybeSingle()
  if (!profile) return null
  return profile
}

// GET — liste les sauvegardes stockées
export async function GET() {
  const profile = await checkAuth()
  if (!profile) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: files, error } = await admin.storage
    .from('backups')
    .list('', { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const backups = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = admin.storage.from('backups').getPublicUrl(f.name)
      // signed URL valable 1h pour téléchargement
      const { data: signed } = await admin.storage
        .from('backups')
        .createSignedUrl(f.name, 3600)
      return {
        name: f.name,
        size: f.metadata?.size ?? 0,
        created_at: f.created_at,
        url: signed?.signedUrl ?? null,
      }
    })
  )

  return NextResponse.json({ backups })
}

// DELETE ?name=xxx — supprime une sauvegarde
export async function DELETE(request) {
  const profile = await checkAuth()
  if (!profile) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (profile.role !== 'super_admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.storage.from('backups').remove([name])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
