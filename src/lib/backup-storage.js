export const BACKUP_TABLES = [
  'home_blocks', 'gym_page_blocks', 'rando_page_blocks', 'nordique_page_blocks',
  'sante_page_blocks', 'asso_page_blocks',
  'gym_courses', 'vacances_scolaires', 'rando_sorties', 'rando_jeudi_groupes',
  'gym_disciplines', 'gym_animateurs',
  'actualites', 'sejours', 'galerie_photos', 'ag_documents',
  'bureau', 'tarifs', 'site_stats',
  'admin_profiles', 'contact_messages', 'activity_log',
]

export const BACKUP_RETENTION_DAYS = 90

export async function ensureBackupBucket(admin) {
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

export async function createStorageBackup(admin, { source = 'manual-bucket', retentionDays = BACKUP_RETENTION_DAYS } = {}) {
  const bucketError = await ensureBackupBucket(admin)

  if (bucketError) {
    return { ok: false, error: bucketError.message, status: 500 }
  }

  const backup = {
    meta: {
      version: '1.0',
      site: 'AGMR — Gym Marche Rambouillet',
      created_at: new Date().toISOString(),
      tables: BACKUP_TABLES.length,
      source,
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

  const { error: uploadError } = await admin.storage
    .from('backups')
    .upload(filename, json, { contentType: 'application/json', upsert: false })

  if (uploadError) {
    return { ok: false, error: uploadError.message, status: 500 }
  }

  const { data: files } = await admin.storage
    .from('backups')
    .list('', { sortBy: { column: 'created_at', order: 'asc' } })

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  const toDelete = (files ?? [])
    .filter(file => file.created_at && new Date(file.created_at).getTime() < cutoff)
    .map(file => file.name)

  if (toDelete.length > 0) {
    await admin.storage.from('backups').remove(toDelete)
  }

  return {
    ok: true,
    file: filename,
    size: Buffer.byteLength(json),
    tables: BACKUP_TABLES.length,
    tableErrors,
    retentionDays,
    pruned: toDelete.length,
    backedUpAt: new Date().toISOString(),
  }
}
