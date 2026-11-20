'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function AdminStatsSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const supabase = createClient()

  const fetch = async () => {
    const { data, error } = await supabase
      .from('site_stats')
      .select('*')
      .order('section')
      .order('ordre')
    if (!error) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const save = async (item) => {
    await supabase
      .from('site_stats')
      .update({ valeur: item.valeur, label: item.label })
      .eq('id', item.id)
    setEditing(null)
    fetch()
  }

  const hero = items.filter(s => s.section === 'hero')
  const band = items.filter(s => s.section === 'band')

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Chiffres clés <HelpTip text="Modifiez ici les statistiques affichées sur la page d'accueil du site : les 3 chiffres du bandeau hero (ex : nombre d'adhérents, d'heures de cours) et les 4 chiffres du bandeau de statistiques en bas de page." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Grande photo d'accueil + bandeau de chiffres — <strong style={{ color: "var(--green)" }}>données Supabase</strong></p>
        </div>
      </div>

      <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 12 }}>
        Section Hero (3 chiffres)
      </h3>
      <table className="tbl" style={{ marginBottom: 32 }}>
        <thead><tr><th>Valeur</th><th>Label</th><th></th></tr></thead>
        <tbody>
          {hero.map(s => (
            <tr key={s.id}>
              <td><strong style={{ fontFamily: "var(--serif)", fontSize: "1.3rem" }}>{s.valeur}</strong></td>
              <td style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem" }}>{s.label}</td>
              <td style={{ textAlign: "right" }}>
                <button className="icon-btn" onClick={() => setEditing(s)}><Icon name="edit" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 12 }}>
        Bandeau de statistiques (4 chiffres)
      </h3>
      <table className="tbl">
        <thead><tr><th>Valeur</th><th>Description</th><th></th></tr></thead>
        <tbody>
          {band.map(s => (
            <tr key={s.id}>
              <td><strong style={{ fontFamily: "var(--serif)", fontSize: "1.3rem" }}>{s.valeur}</strong></td>
              <td>{s.label}</td>
              <td style={{ textAlign: "right" }}>
                <button className="icon-btn" onClick={() => setEditing(s)}><Icon name="edit" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title="Modifier le chiffre" onClose={() => setEditing(null)}>
          <StatForm item={editing} onSave={save} onCancel={() => setEditing(null)}/>
        </Modal>
      )}
    </>
  )
}

function StatForm({ item, onSave, onCancel }) {
  const [f, setF] = useState(item)
  const u = (k, v) => setF({ ...f, [k]: v })
  return (
    <div className="form">
      <div className="field">
        <label>Valeur affichée</label>
        <input value={f.valeur} onChange={e => u("valeur", e.target.value)} placeholder="ex: 750+, 43h, 25…"/>
      </div>
      <div className="field">
        <label>Label / description</label>
        <input value={f.label} onChange={e => u("label", e.target.value)} placeholder="ex : Adhérents en 2025-2026"/>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}
