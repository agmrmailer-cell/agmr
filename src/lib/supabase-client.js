import { createBrowserClient } from '@supabase/ssr'
import { frenchError } from './errors'

// Toute écriture refusée par la base (ajout, modification, suppression, envoi de fichier) est signalée
// à l'interface par l'évènement « agmr-db-error », même si l'écran concerné ne vérifie pas le résultat.
function report(error) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agmr-db-error', { detail: { message: frenchError(error) } }))
  }
}

async function reportingFetch(input, init = {}) {
  const method = (init.method ?? 'GET').toUpperCase()
  const isWrite = method !== 'GET' && method !== 'HEAD'
  let res
  try {
    res = await fetch(input, init)
  } catch (err) {
    if (isWrite) report(err)
    throw err
  }
  if (!res.ok && isWrite) {
    res.clone().json()
      .catch(() => ({ message: res.statusText, code: String(res.status) }))
      .then(report)
  }
  return res
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { fetch: reportingFetch } }
  )
}
