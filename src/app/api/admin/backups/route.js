import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { ensureBackupBucket, createStorageBackup } from '@/lib/backup-storage'

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
  const bucketError = await ensureBackupBucket(admin)

  if (bucketError) return NextResponse.json({ error: bucketError.message }, { status: 500 })

  const { data: files, error } = await admin.storage
    .from('backups')
    .list('', { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const backups = await Promise.all(
    (files ?? []).map(async (f) => {
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

// PUT — créer une sauvegarde manuelle dans le bucket Storage
export async function PUT() {
  const profile = await checkAuth()
  if (!profile) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (profile.role !== 'super_admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()
  const result = await createStorageBackup(admin, { source: 'manual-bucket' })

  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 })
}

// POST — restaurer depuis une sauvegarde (ancien /api/admin/backups/restore)
const ALLOWED_TABLES = new Set([
  'home_blocks', 'gym_page_blocks', 'rando_page_blocks', 'nordique_page_blocks',
  'sante_page_blocks', 'asso_page_blocks',
  'gym_courses', 'vacances_scolaires', 'rando_sorties', 'rando_jeudi_groupes',
  'gym_disciplines', 'gym_animateurs',
  'actualites', 'sejours', 'galerie_photos', 'ag_documents',
  'bureau', 'tarifs', 'site_stats',
  'admin_profiles', 'contact_messages', 'activity_log',
])

export async function POST(request) {
  const supabase = await (await import('@/lib/supabase-server')).createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase
    .from('admin_profiles').select('role').eq('email', user.email).maybeSingle()
  if (profile?.role !== 'super_admin')
    return NextResponse.json({ error: 'Réservé aux super_admin' }, { status: 403 })

  const body = await request.json()
  let backupData = body.data
  const selectedTables = body.tables

  if (!backupData && body.storagePath) {
    const admin = createAdminClient()
    const { data: fileData, error } = await admin.storage.from('backups').download(body.storagePath)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    try { backupData = JSON.parse(await fileData.text()).data } catch {
      return NextResponse.json({ error: 'Fichier JSON invalide' }, { status: 400 })
    }
  }

  if (!backupData || typeof backupData !== 'object')
    return NextResponse.json({ error: 'Données de sauvegarde manquantes' }, { status: 400 })

  const admin = createAdminClient()
  const results = {}
  const tablesToRestore = selectedTables
    ? selectedTables.filter(t => ALLOWED_TABLES.has(t))
    : Object.keys(backupData).filter(t => ALLOWED_TABLES.has(t))

  for (const table of tablesToRestore) {
    const rows = backupData[table]
    if (!Array.isArray(rows)) { results[table] = { skipped: true }; continue }
    const { error: delErr } = await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (delErr) { results[table] = { error: delErr.message }; continue }
    if (rows.length > 0) {
      const { error: insErr } = await admin.from(table).insert(rows)
      results[table] = insErr ? { error: insErr.message } : { restored: rows.length }
    } else {
      results[table] = { restored: 0 }
    }
  }
  return NextResponse.json({ ok: true, results })
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
