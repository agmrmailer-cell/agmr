'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import HelpTip from '@/components/ui/HelpTip'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function daysBetween(d1, d2) {
  const a = new Date(d1), b = new Date(d2)
  return Math.round((b - a) / 864e5) + 1
}

export default function AdminVacancesSection() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase
      .from('vacances_scolaires')
      .select('*')
      .order('date_debut')
    if (!error) setItems(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async (f) => {
    const payload = { nom: f.nom, date_debut: f.date_debut, date_fin: f.date_fin, zone: f.zone || 'C' }
    if (f.id) {
      await supabase.from('vacances_scolaires').update(payload).eq('id', f.id)
      await logActivity(supabase, { message: `Vacances modifiées — ${f.nom}`, section: 'vacances', action: 'update' })
    } else {
      await supabase.from('vacances_scolaires').insert(payload)
      await logActivity(supabase, { message: `Vacances ajoutées — ${f.nom}`, section: 'vacances', action: 'create' })
    }
    setEditing(null); load()
  }

  const del = async (id) => {
    if (!confirm('Supprimer cette période de vacances ?')) return
    const vac = items.find(i => i.id === id)
    await supabase.from('vacances_scolaires').delete().eq('id', id)
    await logActivity(supabase, { message: `Vacances supprimées — ${vac?.nom ?? ''}`, section: 'vacances', action: 'delete' })
    load()
  }

  const blank = { nom: '', date_debut: '', date_fin: '', zone: 'C' }

  if (loading) return <div style={{ padding: 40, color: 'var(--ink-mute)' }}>Chargement…</div>

  // Determine if a period is past / current / future
  const today = new Date().toISOString().slice(0, 10)
  const status = (v) => {
    if (v.date_fin < today)   return { label: 'Passées',    color: 'var(--ink-mute)', bg: 'var(--bg-deep)' }
    if (v.date_debut <= today) return { label: 'En cours',  color: '#166534',         bg: '#dcfce7' }
    return                           { label: 'À venir',    color: 'var(--accent)',   bg: 'var(--accent-tint)' }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Vacances scolaires <HelpTip text="Renseignez ici les périodes de vacances scolaires. Pendant ces périodes, les cours sont automatiquement masqués dans le planning gym public. La Zone C correspond à l'Île-de-France (Rambouillet)." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Périodes sans cours · Zone C (Île-de-France)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(blank)}>
          <Icon name="plus" size={14}/> Ajouter une période <HelpTip text="Crée une nouvelle période de vacances. Donnez-lui un nom (ex : 'Vacances de Noël 2025-2026'), choisissez les dates de début et de fin, et la zone scolaire. Les cours seront automatiquement masqués pendant ces dates." position="bottom" />
        </button>
      </div>

      <div style={{ background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: 24, fontSize: '0.88rem', color: 'var(--ink-soft)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Icon name="info" size={16}/>
        <span>Les jours de vacances sont automatiquement grisés dans le planning gym. Aucun cours n'est affiché pendant ces périodes.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(v => {
          const st = status(v)
          return (
            <div key={v.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Icône */}
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: st.bg, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                🏖️
              </div>
              {/* Infos */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{v.nom}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--ink-mute)', marginTop: 2 }}>
                  {formatDate(v.date_debut)} → {formatDate(v.date_fin)}
                  <span style={{ marginLeft: 8 }}>· {daysBetween(v.date_debut, v.date_fin)} jours</span>
                  <span style={{ marginLeft: 8 }}>· Zone {v.zone}</span>
                </div>
              </div>
              {/* Badge statut */}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: st.color, background: st.bg, borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                {st.label}
              </span>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="icon-btn" onClick={() => setEditing(v)}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(v.id)}><Icon name="trash" size={14}/></button>
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ink-mute)', padding: 48 }}>
            Aucune période configurée
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Modifier la période' : 'Nouvelle période'} onClose={() => setEditing(null)}>
          <VacancesForm item={editing} onSave={save} onCancel={() => setEditing(null)}/>
        </Modal>
      )}
    </>
  )
}

function VacancesForm({ item, onSave, onCancel }) {
  const [f, setF] = useState({ ...item })
  const u = (k, v) => setF(p => ({ ...p, [k]: v }))

  const duration = f.date_debut && f.date_fin && f.date_fin >= f.date_debut
    ? daysBetween(f.date_debut, f.date_fin)
    : null

  return (
    <div className="form">
      <div className="field">
        <label>Nom de la période <HelpTip text="Un nom descriptif pour identifier facilement la période. Exemple : 'Vacances de Toussaint 2025' ou 'Noël 2025-2026'." position="right" /></label>
        <input value={f.nom} onChange={e => u('nom', e.target.value)} placeholder="Vacances de Noël 2025-2026"/>
      </div>
      <div className="row-2">
        <div className="field">
          <label>Date de début</label>
          <input type="date" value={f.date_debut} onChange={e => u('date_debut', e.target.value)}/>
        </div>
        <div className="field">
          <label>Date de fin</label>
          <input type="date" value={f.date_fin} onChange={e => u('date_fin', e.target.value)}/>
        </div>
      </div>
      {duration !== null && (
        <div style={{ fontSize: '0.84rem', color: 'var(--ink-mute)', marginTop: -4 }}>
          Durée : <strong>{duration} jour{duration > 1 ? 's' : ''}</strong>
        </div>
      )}
      <div className="field">
        <label>Zone scolaire <HelpTip text="Rambouillet est en Zone C. Laissez ce paramètre sur Zone C sauf si vous gérez des cours dans une autre région." position="right" /></label>
        <select value={f.zone} onChange={e => u('zone', e.target.value)}>
          <option value="A">Zone A</option>
          <option value="B">Zone B</option>
          <option value="C">Zone C — Île-de-France (Rambouillet)</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary"
          disabled={!f.nom || !f.date_debut || !f.date_fin}
          onClick={() => onSave(f)}>
          Enregistrer
        </button>
      </div>
    </div>
  )
}
