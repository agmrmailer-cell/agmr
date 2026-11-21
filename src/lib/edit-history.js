'use client'
import { saveEditable } from './editable-save'
import { logActivity } from './activity'

// Historique des modifications faites en mode édition visuelle, pour pouvoir les annuler.
// Conservé dans l'onglet du navigateur (sessionStorage) : il survit aux changements de page
// et aux rechargements, et disparaît à la fermeture de l'onglet.
//
// Chaque entrée : { label, at, undo: [opération…] } — les opérations rétablissent l'état d'avant :
//   { type: 'value',  src, value }          → remet une valeur (texte, image…) via saveEditable
//   { type: 'update', table, id, patch }    → remet des colonnes d'une ligne
//   { type: 'insert', table, row }          → recrée une ligne supprimée
//   { type: 'orders', table, orders: [{ id, ordre }] } → remet l'ordre des blocs

const KEY = 'agmr_edit_history'
const MAX = 50
export const HISTORY_EVENT = 'agmr-edit-history'

export function readHistory() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '[]') } catch { return [] }
}

function write(list) {
  try { sessionStorage.setItem(KEY, JSON.stringify(list.slice(-MAX))) } catch {}
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT))
}

export function pushHistory(label, undo) {
  write([...readHistory(), { label, at: Date.now(), undo }])
}

async function apply(supabase, op) {
  if (op.type === 'value') return saveEditable(supabase, op.src, op.value, { log: false })
  let res
  if (op.type === 'update') res = await supabase.from(op.table).update(op.patch).eq('id', op.id)
  else if (op.type === 'insert') res = await supabase.from(op.table).insert(op.row)
  else if (op.type === 'orders') {
    const results = await Promise.all(op.orders.map(o => supabase.from(op.table).update({ ordre: o.ordre }).eq('id', o.id)))
    res = results.find(r => r.error) ?? {}
  }
  if (res?.error) throw res.error
}

// Annule la dernière modification. Renvoie son libellé, ou null s'il n'y avait rien à annuler.
export async function undoLast(supabase) {
  const list = readHistory()
  const entry = list[list.length - 1]
  if (!entry) return null
  for (const op of entry.undo) await apply(supabase, op)
  write(list.slice(0, -1))
  await logActivity(supabase, { message: `Édition visuelle - annulation : ${entry.label}`, section: 'edition-visuelle', action: 'update' })
  return entry.label
}
