import { createAdminClient } from '@/lib/supabase-admin'
import { createStorageBackup } from '@/lib/backup-storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function unauthorized() {
  return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function missingEnv(name) {
  return Response.json({ ok: false, error: `${name} not configured` }, { status: 500 })
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret) return Response.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 })
  if (authHeader !== `Bearer ${cronSecret}`) return unauthorized()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return missingEnv('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return missingEnv('SUPABASE_SERVICE_ROLE_KEY')

  const admin = createAdminClient()
  const result = await createStorageBackup(admin, { source: 'cron-auto' })

  return Response.json(result, { status: result.ok ? 200 : result.status ?? 500 })
}
