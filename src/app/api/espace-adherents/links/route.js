import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isCurrent(link) {
  const now = Date.now()
  if (link.starts_at && new Date(link.starts_at).getTime() > now) return false
  if (link.ends_at && new Date(link.ends_at).getTime() < now) return false
  return true
}

export async function POST(request) {
  const expectedCode = process.env.ADHERENTS_ACCESS_CODE

  if (!expectedCode) {
    return Response.json(
      { ok: false, error: 'ADHERENTS_ACCESS_CODE is not configured' },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => ({}))
  if (body.code !== expectedCode) {
    return Response.json({ ok: false, error: 'Code incorrect' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('external_links')
    .select('*')
    .eq('active', true)
    .eq('members_only', true)
    .contains('zones', ['espace-adherents'])
    .order('ordre')

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })

  return Response.json({
    ok: true,
    links: (data ?? []).filter(isCurrent),
  })
}
