'use client'

// Le mot de passe adhérents est mémorisé pour la session du navigateur :
// une fois saisi (espace adhérents ou planning rando), les autres pages protégées s'ouvrent directement.
const KEY = 'agmr_members_code'

export function getStoredCode() {
  try { return sessionStorage.getItem(KEY) ?? '' } catch { return '' }
}

export function storeCode(code) {
  try { if (code) sessionStorage.setItem(KEY, code); else sessionStorage.removeItem(KEY) } catch {}
}

export async function fetchMembersLinks(code, zone) {
  const res = await fetch('/api/espace-adherents/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, zone }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.ok === false) throw new Error(json.error ?? 'Accès impossible')
  return json.links ?? []
}
