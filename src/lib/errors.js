// Traduit les erreurs techniques (Supabase, réseau…) en messages compréhensibles par un bénévole.
export function frenchError(err) {
  const raw = typeof err === 'string' ? err : (err?.message ?? err?.error_description ?? err?.error ?? '')
  const code = typeof err === 'object' && err ? String(err.code ?? err.statusCode ?? '') : ''
  const msg = String(raw)
  const low = msg.toLowerCase()

  if (!msg && !code) return 'Une erreur inattendue est survenue. Réessayez dans un instant.'

  if (code === '42501' || low.includes('row-level security') || low.includes('permission denied') || low.includes('violates row-level'))
    return "Vous n'avez pas le droit de modifier cette partie du site. Demandez l'accès au super-administrateur (Réglages → Gestion des accès)."

  if (code === '42P01' || code === 'PGRST205' || low.includes('does not exist') || low.includes('could not find the table') || low.includes('schema cache'))
    return "Cette fonction n'est pas encore activée : la mise à jour de la base de données (fichier SQL) doit être exécutée dans Supabase."

  if (low.includes('jwt expired') || low.includes('invalid jwt') || low.includes('refresh token') || code === 'PGRST301')
    return 'Votre session a expiré. Reconnectez-vous puis recommencez.'

  if (low.includes('failed to fetch') || low.includes('networkerror') || low.includes('network request failed') || low.includes('load failed'))
    return 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.'

  if (code === '23505' || low.includes('duplicate key'))
    return 'Cet élément existe déjà.'

  if (code === '23502' || low.includes('null value in column'))
    return 'Un champ obligatoire est vide.'

  if (code === '22P02' || code === '22007' || low.includes('invalid input syntax'))
    return "Une valeur saisie n'a pas le bon format (date, nombre…)."

  if (low.includes('payload too large') || low.includes('exceeded the maximum allowed size') || code === '413')
    return 'Le fichier est trop volumineux.'

  if (low.includes('mime type') || low.includes('invalid file type'))
    return "Ce type de fichier n'est pas accepté."

  if (/^[\x00-\x7F]*$/.test(msg) && msg.length > 0)
    return `L'opération n'a pas pu aboutir. (Détail technique : ${msg})`

  return msg
}
