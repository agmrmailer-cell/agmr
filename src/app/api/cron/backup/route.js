import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BACKUP_TABLES = [
  'home_blocks', 'gym_page_blocks', 'rando_page_blocks', 'nordique_page_blocks',
  'sante_page_blocks', 'asso_page_blocks',
  'gym_courses', 'vacances_scolaires', 'rando_sorties', 'rando_jeudi_groupes',
  'gym_disciplines', 'gym_animateurs',
  'actualites', 'sejours', 'galerie_photos', 'ag_documents',
  'bureau', 'tarifs', 'site_stats',
  'admin_profiles', 'contact_messages', 'activity_log',
]

const KEEP_BACKUPS = 7

function unauthorized() {
  return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function missingEnv(name) {
  return Response.json({ ok: false, error: `${name} not configured` }, { status: 500 })
}

async function ensureBackupBucket(admin) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets()

  if (listError) return listError
  if (buckets?.some(bucket => bucket.name === 'backups')) return null

  const { error: createError } = await admin.storage.createBucket('backups', {
    public: false,
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    return createError
  }

  return null
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret) return Response.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 })
  if (authHeader !== `Bearer ${cronSecret}`) return unauthorized()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return missingEnv('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return missingEnv('SUPABASE_SERVICE_ROLE_KEY')

  const admin = createAdminClient()
  const bucketError = await ensureBackupBucket(admin)

  if (bucketError) {
    return Response.json({ ok: false, error: bucketError.message }, { status: 500 })
  }

  // Export all tables
  const backup = {
    meta: {
      version: '1.0',
      site: 'AGMR — Gym Marche Rambouillet',
      created_at: new Date().toISOString(),
      tables: BACKUP_TABLES.length,
      source: 'cron-auto',
    },
    data: {},
  }
  const tableErrors = []

  for (const table of BACKUP_TABLES) {
    const { data, error } = await admin.from(table).select('*')
    if (error) {
      backup.data[table] = []
      tableErrors.push({ table, error: error.message })
    } else {
      backup.data[table] = data ?? []
    }
  }

  const json = JSON.stringify(backup)
  const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `agmr-backup-${date}.json`

  // Upload to Storage
  const { error: uploadError } = await admin.storage
    .from('backups')
    .upload(filename, json, { contentType: 'application/json', upsert: false })

  if (uploadError) {
    return Response.json({ ok: false, error: uploadError.message }, { status: 500 })
  }

  // Prune old backups (keep last KEEP_BACKUPS)
  const { data: files } = await admin.storage.from('backups').list('', { sortBy: { column: 'created_at', order: 'asc' } })
  if (files && files.length > KEEP_BACKUPS) {
    const toDelete = files.slice(0, files.length - KEEP_BACKUPS).map(f => f.name)
    await admin.storage.from('backups').remove(toDelete)
  }

  return Response.json({
    ok: true,
    file: filename,
    size: Buffer.byteLength(json),
    tables: BACKUP_TABLES.length,
    tableErrors,
    backedUpAt: new Date().toISOString(),
  })
}
