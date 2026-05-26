'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import { formatDateFR, catLabel } from '@/utils/format'

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

export default function AdminActuSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const supabase = createClient()

  const fetch = async () => {
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .order('date', { ascending: false })
    if (!error) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const save = async (item) => {
    const payload = { cat: item.cat, date: item.date, title: item.title, excerpt: item.excerpt }
    if (item.id) {
      await supabase.from('actualites').update(payload).eq('id', item.id)
    } else {
      await supabase.from('actualites').insert(payload)
    }
    setEditing(null)
    fetch()
  }

  const del = async (id) => {
    if (!confirm("Supprimer cet article ?")) return
    await supabase.from('actualites').delete().eq('id', id)
    fetch()
  }

  const blank = { cat: "asso", date: new Date().toISOString().slice(0,10), title: "", excerpt: "" }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Actualités</h1>
          <p className="muted" style={{ margin: 0 }}>{items.length} articles — <strong style={{ color: "var(--green)" }}>données Supabase</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(blank)}>
          <Icon name="plus" size={16}/> Nouvel article
        </button>
      </div>

      <table className="tbl">
        <thead><tr><th>Date</th><th>Catégorie</th><th>Titre</th><th>Extrait</th><th></th></tr></thead>
        <tbody>
          {items.map(n => (
            <tr key={n.id}>
              <td style={{ whiteSpace: "nowrap" }}>{formatDateFR(n.date)}</td>
              <td><span className={`news-cat news-cat-${n.cat}`}>{catLabel(n.cat)}</span></td>
              <td><strong>{n.title}</strong></td>
              <td className="muted" style={{ fontSize: "0.88rem", maxWidth: 280 }}>{n.excerpt?.slice(0, 70)}…</td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="icon-btn" onClick={() => setEditing(n)}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(n.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? "Modifier l'article" : "Nouvel article"} onClose={() => setEditing(null)}>
          <div className="form">
            <div className="row-2">
              <div className="field"><label>Catégorie</label>
                <select value={editing.cat} onChange={e => setEditing({ ...editing, cat: e.target.value })}>
                  {["gym","rando","nordique","asso","event"].map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                </select>
              </div>
              <div className="field"><label>Date</label>
                <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })}/>
              </div>
            </div>
            <div className="field"><label>Titre</label>
              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}/>
            </div>
            <div className="field"><label>Contenu</label>
              <textarea rows={6} value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}/>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={() => save(editing)}>Publier</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
