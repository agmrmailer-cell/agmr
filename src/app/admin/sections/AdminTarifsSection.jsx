'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import HelpTip from '@/components/ui/HelpTip'

const CAT_LABELS   = { gym: 'Gym', marche: 'Marche & Nordique' }
const CAT_OPTIONS  = [
  { value: 'gym',    label: 'Gym' },
  { value: 'marche', label: 'Marche & Nordique' },
]

// ── Ligne éditable ────────────────────────────────────────────
function TarifRow({ item, onChange, onDelete }) {
  const [label, setLabel] = useState(item.label)
  const [val,   setVal]   = useState(item.valeur)
  const [note,  setNote]  = useState(item.note ?? '')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!label.trim()) return
    await onChange(item.id, label.trim(), val.trim(), note.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }
  const onKey = (e) => { if (e.key === 'Enter') save() }

  return (
    <tr>
      <td>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={save}
          onKeyDown={onKey}
          placeholder="Libellé…"
          style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: '0.94rem', background: 'var(--bg-card)', color: 'var(--ink)' }}
        />
      </td>
      <td style={{ width: 160 }}>
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={onKey}
          placeholder="ex : 32 €"
          style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: '0.94rem', background: 'var(--bg-card)', color: 'var(--ink)' }}
        />
      </td>
      <td style={{ width: 200 }}>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={save}
          onKeyDown={onKey}
          placeholder="Note optionnelle…"
          style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: '0.88rem', background: 'var(--bg-card)', color: 'var(--ink-mute)' }}
        />
      </td>
      <td style={{ width: 60, textAlign: 'right', whiteSpace: 'nowrap' }}>
        {saved
          ? <span style={{ color: 'var(--green)', fontSize: '0.9rem' }}>✓</span>
          : <button className="icon-btn" style={{ color: 'var(--accent)' }} onClick={() => onDelete(item.id)} title="Supprimer cette ligne">
              <Icon name="trash" size={13}/>
            </button>
        }
      </td>
    </tr>
  )
}

// ── Ligne "ajouter" ───────────────────────────────────────────
function AddRow({ categorie, maxOrdre, onAdd }) {
  const [open, setOpen]   = useState(false)
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)

  const submit = async () => {
    if (!label.trim()) return
    setAdding(true)
    await onAdd({ categorie, label: label.trim(), valeur: '', note: null, ordre: maxOrdre + 1 })
    setLabel('')
    setOpen(false)
    setAdding(false)
  }

  if (!open) return (
    <tr>
      <td colSpan={4} style={{ padding: '8px 18px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen(true)}
          style={{ color: 'var(--green)', borderColor: 'var(--green-soft)' }}
        >
          <Icon name="plus" size={13}/> Ajouter une ligne
        </button>
      </td>
    </tr>
  )

  return (
    <tr style={{ background: 'var(--green-tint)' }}>
      <td style={{ padding: '8px 18px' }}>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
          placeholder="Nouveau libellé…"
          autoFocus
          style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--green)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: '0.94rem', background: '#fff' }}
        />
      </td>
      <td colSpan={2} style={{ fontSize: '0.82rem', color: 'var(--ink-mute)', padding: '0 10px' }}>
        Tarif et note éditables après ajout
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={adding || !label.trim()}>
          {adding ? '…' : 'Ajouter'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setLabel('') }} style={{ marginLeft: 6 }}>
          ✕
        </button>
      </td>
    </tr>
  )
}

// ── Section principale ────────────────────────────────────────
export default function AdminTarifsSection() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('tarifs').select('*').order('categorie').order('ordre')
    setItems(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateRow = async (id, label, valeur, note) => {
    await supabase.from('tarifs').update({ label, valeur, note: note || null }).eq('id', id)
  }

  const deleteRow = async (id) => {
    if (!confirm('Supprimer cette ligne ?')) return
    await supabase.from('tarifs').delete().eq('id', id)
    await logActivity(supabase, { message: 'Ligne tarif supprimée', section: 'tarifs', action: 'delete' })
    load()
  }

  const addRow = async (row) => {
    await supabase.from('tarifs').insert(row)
    await logActivity(supabase, { message: `Tarif ajouté — ${row.label}`, section: 'tarifs', action: 'create' })
    load()
  }

  const grouped = items
    .filter(t => t.categorie !== '__meta__')
    .reduce((acc, t) => {
      if (!acc[t.categorie]) acc[t.categorie] = []
      acc[t.categorie].push(t)
      return acc
    }, {})

  if (loading) return <div style={{ padding: 40, color: 'var(--ink-mute)' }}>Chargement…</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Tarifs <HelpTip text="Gérez les tarifs d'adhésion affichés sur le site. Cliquez directement dans un champ pour modifier la valeur, puis appuyez sur Entrée ou cliquez ailleurs pour enregistrer. Un ✓ vert confirme la sauvegarde." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>
            Saison 2025-2026 — enregistrement automatique ·{' '}
            <strong style={{ color: 'var(--green)' }}>données Supabase</strong>
          </p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/inscriptions/tarifs" target="_blank" rel="noopener noreferrer">
          Voir la page →
        </a>
      </div>

      <div style={{ background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--r-sm)', padding: '10px 16px', marginBottom: 24, fontSize: '0.88rem', color: 'var(--ink-soft)', display: 'flex', gap: 8 }}>
        <Icon name="info" size={15}/>
        <span>Modifiez un champ puis appuyez sur <kbd style={{ background: 'var(--bg-deep)', padding: '1px 5px', borderRadius: 3, fontSize: '0.82rem' }}>Entrée</kbd> ou cliquez ailleurs pour enregistrer. Les ✓ confirment la sauvegarde.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {CAT_OPTIONS.map(({ value: cat, label: catLabel }) => {
          const rows = grouped[cat] ?? []
          const maxOrdre = rows.reduce((m, r) => Math.max(m, r.ordre ?? 0), 0)
          return (
            <div key={cat} style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--green)', padding: '14px 20px' }}>
                <h3 style={{ color: '#fff', fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  {catLabel}
                </h3>
              </div>
              <table className="tbl" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Tarif</th>
                    <th>Note</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(item => (
                    <TarifRow key={item.id} item={item} onChange={updateRow} onDelete={deleteRow}/>
                  ))}
                  <AddRow categorie={cat} maxOrdre={maxOrdre} onAdd={addRow}/>
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      {/* Note globale */}
      <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 20 }}>
        <NoteGlobale supabase={supabase}/>
      </div>
    </>
  )
}

function NoteGlobale({ supabase }) {
  const [val, setVal]     = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('tarifs').select('note').eq('label', '__note_globale__').maybeSingle()
      .then(({ data }) => { if (data?.note) setVal(data.note) })
  }, [])

  const save = async () => {
    const { data } = await supabase.from('tarifs').select('id').eq('label', '__note_globale__').maybeSingle()
    if (data?.id) {
      await supabase.from('tarifs').update({ note: val }).eq('id', data.id)
    } else {
      await supabase.from('tarifs').insert({ categorie: '__meta__', label: '__note_globale__', valeur: '', note: val, ordre: 99 })
    }
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="field">
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Message affiché sous le tableau (ex : date du Forum des Associations)</span>
        {saved && <span style={{ color: 'var(--green)', fontSize: '0.84rem' }}>✓ Enregistré</span>}
      </label>
      <textarea rows={2} value={val} onChange={e => setVal(e.target.value)} onBlur={save}
        placeholder="Les tarifs définitifs seront communiqués lors du Forum des Associations…"/>
    </div>
  )
}
