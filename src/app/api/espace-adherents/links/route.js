import { createAdminClient } from '@/lib/supabase-admin'
import { isHtml } from '@/lib/rich-text'
import { sanitizeRichText } from '@/lib/rich-text-sanitize'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isCurrent(link) {
  const now = Date.now()
  if (link.starts_at && new Date(link.starts_at).getTime() > now) return false
  if (link.ends_at && new Date(link.ends_at).getTime() < now) return false
  return true
}

// Mot de passe adhérents : défini dans l'admin (table privée site_settings),
// sinon repli sur la variable d'environnement ADHERENTS_ACCESS_CODE.
async function getExpectedCode(supabase) {
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'members_password').maybeSingle()
  return data?.value?.trim() || process.env.ADHERENTS_ACCESS_CODE || null
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const supabase = createAdminClient()
  const expectedCode = await getExpectedCode(supabase)

  if (!expectedCode) {
    return Response.json(
      { ok: false, error: "Le mot de passe adhérents n'est pas encore défini (Réglages → Mot de passe adhérents)." },
      { status: 500 }
    )
  }

  if (typeof body.code !== 'string' || body.code.trim() !== expectedCode) {
    return Response.json({ ok: false, error: 'Mot de passe incorrect' }, { status: 401 })
  }

  // Zones protégées par le mot de passe adhérents
  //  - espace-adherents : liens marqués « réservés aux adhérents »
  //  - planning-rando   : tous les liens du planning (non public pour des raisons de sécurité)
  const zone = body.zone === 'planning-rando' ? 'planning-rando' : 'espace-adherents'

  let query = supabase
    .from('external_links')
    .select('*')
    .eq('active', true)
    .contains('zones', [zone])
    .order('ordre')
  if (zone === 'espace-adherents') query = query.eq('members_only', true)
  const { data, error } = await query

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })

  return Response.json({
    ok: true,
    links: (data ?? []).filter(isCurrent).map(link => ({
      ...link,
      description: isHtml(link.description) ? sanitizeRichText(link.description) : link.description,
    })),
  })
}
