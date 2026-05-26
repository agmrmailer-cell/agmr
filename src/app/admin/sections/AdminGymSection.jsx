'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'

const DAYS = ["lundi","mardi","mercredi","jeudi","vendredi","samedi"]
const DISCS = ["pilates","yoga","stretch","senior","renfo","step","fitball","pound","low","tendance"]

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

export default function AdminGymSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [fd, setFd] = useState("all")
  const supabase = createClient()

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('gym_courses')
      .select('*')
      .order('jour')
    if (!error) {
      setItems(data.map(c => ({
        id: c.id,
        jour: c.jour,
        heureDebut: c.heure_debut,
        heureFin: c.heure_fin,
        discipline: c.discipline,
        animateur: c.animateur,
        salle: c.salle,
        niveau: c.niveau,
        actif: c.actif,
        disc: c.disc,
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchCourses() }, [])

  const save = async (item) => {
    const payload = {
      jour: item.jour,
      heure_debut: item.heureDebut,
      heure_fin: item.heureFin,
      discipline: item.discipline,
      animateur: item.animateur,
      salle: item.salle,
      niveau: item.niveau,
      actif: item.actif,
      disc: item.disc,
    }
    if (item.id) {
      await supabase.from('gym_courses').update(payload).eq('id', item.id)
    } else {
      await supabase.from('gym_courses').insert(payload)
    }
    setEditing(null)
    fetchCourses()
  }

  const del = async (id) => {
    if (!confirm("Supprimer ce créneau ?")) return
    await supabase.from('gym_courses').delete().eq('id', id)
    fetchCourses()
  }

  const tog = async (id, actif) => {
    await supabase.from('gym_courses').update({ actif: !actif }).eq('id', id)
    fetchCourses()
  }

  const filtered = items.filter(i => fd === "all" || i.jour === fd)
  const blank = { jour: "lundi", heureDebut: "09:00", heureFin: "10:00", discipline: "", animateur: "", salle: "", niveau: "tous", actif: true, disc: "pilates" }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Planning Gym</h1>
          <p className="muted" style={{ margin: 0 }}>{items.length} créneaux · {items.filter(i => i.actif).length} actifs — <strong style={{ color: "var(--green)" }}>données Supabase</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(blank)}>
          <Icon name="plus" size={16}/> Ajouter un créneau
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button className={`chip ${fd === "all" ? "active" : ""}`} onClick={() => setFd("all")}>Tous</button>
        {DAYS.map(d => <button key={d} className={`chip ${fd === d ? "active" : ""}`} onClick={() => setFd(d)} style={{ textTransform: "capitalize" }}>{d}</button>)}
      </div>

      <table className="tbl">
        <thead><tr><th>Jour</th><th>Heure</th><th>Discipline</th><th>Animateur</th><th>Salle</th><th>Actif</th><th></th></tr></thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id} style={{ opacity: c.actif ? 1 : 0.5 }}>
              <td style={{ textTransform: "capitalize" }}>{c.jour}</td>
              <td style={{ whiteSpace: "nowrap" }}>{c.heureDebut} – {c.heureFin}</td>
              <td><strong>{c.discipline}</strong></td>
              <td>{c.animateur}</td>
              <td>{c.salle}</td>
              <td><button className={`switch ${c.actif ? "on" : ""}`} onClick={() => tog(c.id, c.actif)}/></td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="icon-btn" onClick={() => setEditing(c)}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(c.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? "Modifier le créneau" : "Nouveau créneau"} onClose={() => setEditing(null)}>
          <GymForm item={editing} onSave={save} onCancel={() => setEditing(null)}/>
        </Modal>
      )}
    </>
  )
}

function GymForm({ item, onSave, onCancel }) {
  const [f, setF] = useState(item)
  const u = (k, v) => setF({ ...f, [k]: v })
  return (
    <div className="form">
      <div className="row-2">
        <div className="field"><label>Jour</label>
          <select value={f.jour} onChange={e => u("jour", e.target.value)}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="field"><label>Niveau</label>
          <select value={f.niveau} onChange={e => u("niveau", e.target.value)}>
            <option value="tous">Tous niveaux</option>
            <option value="débutant">Débutant</option>
            <option value="intermédiaire">Intermédiaire</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </div>
      <div className="row-2">
        <div className="field"><label>Heure début</label><input type="time" value={f.heureDebut} onChange={e => u("heureDebut", e.target.value)}/></div>
        <div className="field"><label>Heure fin</label><input type="time" value={f.heureFin} onChange={e => u("heureFin", e.target.value)}/></div>
      </div>
      <div className="field"><label>Discipline</label><input value={f.discipline} onChange={e => u("discipline", e.target.value)}/></div>
      <div className="row-2">
        <div className="field"><label>Animateur</label><input value={f.animateur} onChange={e => u("animateur", e.target.value)}/></div>
        <div className="field"><label>Salle</label><input value={f.salle} onChange={e => u("salle", e.target.value)}/></div>
      </div>
      <div className="field"><label>Couleur (disc)</label>
        <select value={f.disc} onChange={e => u("disc", e.target.value)}>
          {DISCS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.92rem" }}>
        <input type="checkbox" checked={f.actif} onChange={e => u("actif", e.target.checked)}/> Créneau actif
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}
