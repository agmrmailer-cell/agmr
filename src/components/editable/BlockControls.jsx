'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'

function notify(message, type = 'ok') {
  window.dispatchEvent(new CustomEvent('agmr-edit-toast', { detail: { message, type } }))
}

// Cadre d'un bloc de page en mode édition visuelle : déplacer, masquer/afficher, supprimer.
// - full : tous les blocs de la table dans l'ordre ({ id, key })
// - seq  : clés des blocs affichés dans cette zone, dans l'ordre (pour savoir qui est au-dessus / en dessous)
export default function BlockControls({ table, id, blockKey, label, visible, full, seq, movable = true, deletable = true, children }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()
  const index = seq.indexOf(blockKey)
  const name = label || blockKey

  const run = async (fn, okMessage, logMessage) => {
    if (!id) { notify("Ce bloc n'existe pas encore en base : créez-le d'abord depuis l'admin.", 'error'); return }
    setBusy(true)
    try {
      await fn()
      await logActivity(supabase, { message: `Édition visuelle - ${logMessage} « ${name} » (${table})`, section: 'edition-visuelle', action: 'update' })
      notify(okMessage)
      startTransition(() => router.refresh())
    } catch (e) {
      notify(e.message, 'error')
    }
    setBusy(false)
  }

  const move = dir => run(async () => {
    const targetKey = seq[index + dir]
    if (!targetKey) return
    const rest = full.filter(b => b.key !== blockKey)
    const targetPos = rest.findIndex(b => b.key === targetKey)
    const me = full.find(b => b.key === blockKey)
    rest.splice(dir < 0 ? targetPos : targetPos + 1, 0, me)
    const updates = rest.filter(b => b.id).map((b, i) => ({ id: b.id, ordre: (i + 1) * 10 }))
    const results = await Promise.all(updates.map(u => supabase.from(table).update({ ordre: u.ordre }).eq('id', u.id)))
    const failed = results.find(r => r.error)
    if (failed) throw new Error(failed.error.message)
  }, dir < 0 ? 'Bloc déplacé vers le haut' : 'Bloc déplacé vers le bas', 'bloc déplacé')

  const toggle = () => run(async () => {
    const { error } = await supabase.from(table).update({ visible: !visible }).eq('id', id)
    if (error) throw new Error(error.message)
  }, visible ? 'Bloc masqué pour les visiteurs' : 'Bloc de nouveau visible', visible ? 'bloc masqué' : 'bloc affiché')

  const remove = () => {
    if (!confirm(`Supprimer définitivement le bloc « ${name} » ?\n\nSon contenu sera perdu. Pour le retirer temporairement, utilisez plutôt « Masquer ».`)) return
    run(async () => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw new Error(error.message)
    }, 'Bloc supprimé', 'bloc supprimé')
  }

  // Les clics sur la barre ne doivent ni naviguer (blocs dans un lien) ni déclencher l'édition de texte
  const stop = e => { e.preventDefault(); e.stopPropagation() }

  return (
    <div className={`block-frame${visible ? '' : ' is-hidden'}${busy ? ' is-busy' : ''}`}>
      <div className="block-frame-bar" onClick={stop}>
        <span className="block-frame-label">{name}{!visible && ' · masqué'}</span>
        {movable && (
          <>
            <button type="button" title="Monter le bloc" disabled={busy || index <= 0} onClick={e => { stop(e); move(-1) }}>↑</button>
            <button type="button" title="Descendre le bloc" disabled={busy || index < 0 || index >= seq.length - 1} onClick={e => { stop(e); move(1) }}>↓</button>
          </>
        )}
        <button type="button" disabled={busy} onClick={e => { stop(e); toggle() }}>{visible ? 'Masquer' : 'Afficher'}</button>
        {deletable && <button type="button" className="danger" disabled={busy} onClick={e => { stop(e); remove() }}>Supprimer</button>}
      </div>
      {children}
    </div>
  )
}
