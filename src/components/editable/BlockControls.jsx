'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import { frenchError } from '@/lib/errors'
import { pushHistory } from '@/lib/edit-history'

function notify(message, type = 'ok') {
  window.dispatchEvent(new CustomEvent('agmr-edit-toast', { detail: { message, type } }))
}

// Bloc en cours de glissement (dataTransfer n'est pas lisible pendant le survol)
let dragging = null

// Cadre d'un bloc de page en mode édition visuelle : glisser-déposer, monter/descendre,
// masquer/afficher, supprimer. Chaque action peut être annulée depuis la barre « Mode édition ».
// - full : tous les blocs de la table dans l'ordre ({ id, key, ordre })
// - seq  : clés des blocs affichés dans cette zone, dans l'ordre (un bloc ne se dépose que dans sa zone)
export default function BlockControls({ table, id, blockKey, label, visible, full, seq, movable = true, deletable = true, children }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState(false)
  const [drop, setDrop] = useState(null) // 'before' | 'after' : ligne de dépôt affichée
  const [isDragged, setIsDragged] = useState(false)
  const [, startTransition] = useTransition()
  const index = seq.indexOf(blockKey)
  const zone = `${table}|${seq.join(',')}`
  const name = label || blockKey

  const run = async (fn, okMessage, logMessage) => {
    if (!id) { notify("Ce bloc n'existe pas encore en base : créez-le d'abord depuis l'admin.", 'error'); return }
    setBusy(true)
    try {
      const done = await fn()
      if (done === false) { setBusy(false); return }
      await logActivity(supabase, { message: `Édition visuelle - ${logMessage} « ${name} » (${table})`, section: 'edition-visuelle', action: 'update' })
      notify(okMessage)
      startTransition(() => router.refresh())
    } catch (e) {
      notify(frenchError(e), 'error')
    }
    setBusy(false)
  }

  // Place le bloc `key` juste avant / après `targetKey`, puis renumérote l'ordre de la table
  const reorder = async (key, targetKey, after) => {
    if (key === targetKey) return false
    const rest = full.filter(b => b.key !== key)
    const me = full.find(b => b.key === key)
    const targetPos = rest.findIndex(b => b.key === targetKey)
    if (!me || targetPos < 0) return false
    rest.splice(after ? targetPos + 1 : targetPos, 0, me)
    if (rest.every((b, i) => b.key === full[i].key)) return false
    const updates = rest.filter(b => b.id).map((b, i) => ({ id: b.id, ordre: (i + 1) * 10 }))
    const results = await Promise.all(updates.map(u => supabase.from(table).update({ ordre: u.ordre }).eq('id', u.id)))
    const failed = results.find(r => r.error)
    if (failed) throw failed.error
    const blockName = full.find(b => b.key === key)?.label || name
    pushHistory(`Bloc « ${key === blockKey ? name : blockName} » déplacé`, [{
      type: 'orders', table,
      orders: full.filter(b => b.id).map((b, i) => ({ id: b.id, ordre: b.ordre ?? (i + 1) * 10 })),
    }])
  }

  const move = dir => run(() => {
    const targetKey = seq[index + dir]
    if (!targetKey) return false
    return reorder(blockKey, targetKey, dir > 0)
  }, dir < 0 ? 'Bloc déplacé vers le haut' : 'Bloc déplacé vers le bas', 'bloc déplacé')

  const toggle = () => run(async () => {
    const { error } = await supabase.from(table).update({ visible: !visible }).eq('id', id)
    if (error) throw error
    pushHistory(`Bloc « ${name} » ${visible ? 'masqué' : 'affiché'}`, [{ type: 'update', table, id, patch: { visible } }])
  }, visible ? 'Bloc masqué pour les visiteurs' : 'Bloc de nouveau visible', visible ? 'bloc masqué' : 'bloc affiché')

  const remove = () => {
    if (!confirm(`Supprimer le bloc « ${name} » ?\n\nVous pourrez l'annuler avec le bouton « Annuler » de la barre du haut tant que cet onglet reste ouvert. Pour le retirer temporairement, utilisez plutôt « Masquer ».`)) return
    run(async () => {
      // On garde une copie complète pour pouvoir le recréer en cas d'annulation
      const { data: row, error: readError } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
      if (readError) throw readError
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      if (row) pushHistory(`Bloc « ${name} » supprimé`, [{ type: 'insert', table, row }])
    }, 'Bloc supprimé', 'bloc supprimé')
  }

  // ── Glisser-déposer (souris) ──
  const onDragStart = e => {
    dragging = { zone, key: blockKey }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', name)
    const frame = e.currentTarget.closest('.block-frame')
    if (frame) e.dataTransfer.setDragImage(frame, 24, 16)
    setIsDragged(true)
  }
  const onDragEnd = () => { dragging = null; setIsDragged(false) }
  const accepts = () => movable && dragging && dragging.zone === zone && dragging.key !== blockKey
  const onDragOver = e => {
    if (!accepts()) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const r = e.currentTarget.getBoundingClientRect()
    // Blocs côte à côte (cartes) : gauche/droite ; sinon haut/bas
    const parentWidth = e.currentTarget.parentElement?.getBoundingClientRect().width || window.innerWidth
    const horizontal = r.width < parentWidth * 0.7
    const after = horizontal ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2
    const pos = after ? 'after' : 'before'
    if (drop !== pos) setDrop(pos)
  }
  const onDragLeave = e => { if (!e.currentTarget.contains(e.relatedTarget)) setDrop(null) }
  const onDrop = e => {
    if (!accepts()) return
    e.preventDefault()
    const key = dragging.key
    const after = drop === 'after'
    setDrop(null)
    dragging = null
    run(() => reorder(key, blockKey, after), 'Bloc déplacé', 'bloc déplacé')
  }

  // Les clics sur la barre ne doivent ni naviguer (blocs dans un lien) ni déclencher l'édition de texte
  const stop = e => { e.preventDefault(); e.stopPropagation() }

  const cls = ['block-frame', !visible && 'is-hidden', busy && 'is-busy', isDragged && 'is-dragged', drop && `drop-${drop}`]
    .filter(Boolean).join(' ')

  return (
    <div className={cls} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div className="block-frame-bar" onClick={stop}>
        {movable && seq.length > 1 && (
          <span
            className="block-frame-handle"
            draggable={!busy}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Glisser pour déplacer le bloc"
            aria-hidden="true"
          >⠿</span>
        )}
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
