'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import { formatDateFR, labelType } from '@/utils/format'
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

export default function AdminRandoSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const supabase = createClient()

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('rando_sorties')
      .select('*')
      .order('date')
    if (!error) {
      setItems(data.map(s => ({
        id: s.id,
        date: s.date,
        type: s.type,
        titre: s.titre,
        distanceKm: s.distance_km,
        denivele: s.denivele,
        groupes: s.groupes || [],
        pointDepart: s.point_depart,
        heureDepart: s.heure_depart,
        animateur: s.animateur,
        complet: s.complet,
        annule: s.annule,
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const save = async (item) => {
    const payload = {
      date: item.date,
      type: item.type,
      titre: item.titre,
      distance_km: item.distanceKm || null,
      denivele: item.denivele || null,
      groupes: item.groupes,
      point_depart: item.pointDepart,
      heure_depart: item.heureDepart,
      animateur: item.animateur,
      complet: item.complet,
      annule: item.annule,
    }
    if (item.id) {
      await supabase.from('rando_sorties').update(payload).eq('id', item.id)
      await logActivity(supabase, { message: `Sortie modifiée — ${item.titre || item.type} du ${item.date}`, section: 'rando', action: 'update' })
    } else {
      await supabase.from('rando_sorties').insert(payload)
      await logActivity(supabase, { message: `Nouvelle sortie — ${item.titre || item.type} du ${item.date}`, section: 'rando', action: 'create' })
    }
    setEditing(null)
    fetchData()
  }

  const del = async (id) => {
    if (!confirm("Supprimer cette sortie ?")) return
    const sortie = items.find(i => i.id === id)
    await supabase.from('rando_sorties').delete().eq('id', id)
    await logActivity(supabase, { message: `Sortie supprimée — ${sortie?.titre || sortie?.type || ''} du ${sortie?.date || ''}`, section: 'rando', action: 'delete' })
    fetchData()
  }

  const togComplet = async (id, complet) => {
    await supabase.from('rando_sorties').update({ complet: !complet }).eq('id', id)
    fetchData()
  }

  const togAnnule = async (id, annule) => {
    await supabase.from('rando_sorties').update({ annule: !annule }).eq('id', id)
    fetchData()
  }

  const blank = {
    date: new Date().toISOString().slice(0,10),
    type: "rando-jeudi",
    titre: "",
    groupes: [],
    pointDepart: "Parking Leclerc",
    heureDepart: "13:45",
    complet: false,
    annule: false,
  }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Planning Randonnée & Nordique <HelpTip text="Gérez ici toutes les sorties à venir (randonnées du jeudi, du dimanche, marche nordique, nocturnes…). Chaque sortie peut être marquée complète, annulée ou rétablie depuis la liste." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>{items.length} sorties — <strong style={{ color: "var(--green)" }}>données Supabase</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(blank)}>
          <Icon name="plus" size={16}/> Programmer une sortie <HelpTip text="Ajoute une nouvelle sortie au planning. Renseignez la date, le type (rando jeudi, dimanche, nordique…), le titre, la distance, le point de départ et l'heure. Les groupes permettent d'indiquer quels niveaux participent." position="bottom" />
        </button>
      </div>

      <table className="tbl">
        <thead><tr><th>Date</th><th>Type</th><th>Titre</th><th>Groupes</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id}>
              <td><strong>{formatDateFR(s.date)}</strong><div className="muted" style={{ fontSize: "0.82rem" }}>{s.heureDepart}</div></td>
              <td><span className="rando-tag">{labelType(s.type)}</span></td>
              <td>
                {s.titre}
                {s.distanceKm && <div className="muted" style={{ fontSize: "0.82rem" }}>{s.distanceKm} km{s.denivele ? ` · ${s.denivele}m` : ""}</div>}
              </td>
              <td>{s.groupes.join(", ")}</td>
              <td>
                {s.complet && <span className="badge badge-full">Complet</span>}
                {s.annule && <span className="badge badge-cancel">Annulée</span>}
                {!s.complet && !s.annule && <span className="badge badge-ok">Ouverte</span>}
              </td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {!s.annule && (
                    <button className="btn btn-sm btn-ghost" onClick={() => togComplet(s.id, s.complet)}>
                      {s.complet ? "Rouvrir" : "Complet"}
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => togAnnule(s.id, s.annule)}
                    style={{ color: s.annule ? "var(--green)" : "var(--accent)" }}
                  >
                    {s.annule ? "Rétablir" : "Annuler"}
                  </button>
                  <button className="icon-btn" onClick={() => setEditing(s)}><Icon name="edit" size={14}/></button>
                  <button className="icon-btn" onClick={() => del(s.id)}><Icon name="trash" size={14}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? "Modifier la sortie" : "Nouvelle sortie"} onClose={() => setEditing(null)}>
          <RandoForm item={editing} onSave={save} onCancel={() => setEditing(null)}/>
        </Modal>
      )}
    </>
  )
}

function RandoForm({ item, onSave, onCancel }) {
  const [f, setF] = useState({ ...item, groupesText: (item.groupes || []).join(", ") })
  const u = (k, v) => setF({ ...f, [k]: v })
  return (
    <div className="form">
      <div className="row-2">
        <div className="field"><label>Date <HelpTip text="La date de la sortie. Les sorties sont affichées dans l'ordre chronologique sur le planning public." position="right" /></label>
          <input type="date" value={f.date} onChange={e => u("date", e.target.value)}/>
        </div>
        <div className="field"><label>Type <HelpTip text="Le type de sortie détermine dans quel planning elle apparaît (Rando jeudi, Randonnée dimanche, Marche nordique mardi ou samedi, etc.)." position="right" /></label>
          <select value={f.type} onChange={e => u("type", e.target.value)}>
            {[["rando-jeudi","Rando jeudi"],["rando-dimanche","Rando dimanche"],["nordique-mardi","Nordique mardi"],["nordique-samedi","Nordique samedi"],["sortie-journee","Sortie journée"],["sejour","Séjour"],["nocturne","Nocturne"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Titre</label>
        <input value={f.titre} onChange={e => u("titre", e.target.value)}/>
      </div>
      <div className="row-3">
        <div className="field"><label>Distance (km)</label>
          <input type="number" value={f.distanceKm || ""} onChange={e => u("distanceKm", e.target.value ? Number(e.target.value) : null)}/>
        </div>
        <div className="field"><label>Dénivelé (m)</label>
          <input type="number" value={f.denivele || ""} onChange={e => u("denivele", e.target.value ? Number(e.target.value) : null)}/>
        </div>
        <div className="field"><label>Heure départ</label>
          <input type="time" value={f.heureDepart} onChange={e => u("heureDepart", e.target.value)}/>
        </div>
      </div>
      <div className="row-2">
        <div className="field"><label>Groupes (séparés par virgule)</label>
          <input value={f.groupesText} onChange={e => u("groupesText", e.target.value)} placeholder="Gr 1, Gr 2A, Tous"/>
        </div>
        <div className="field"><label>Point de départ</label>
          <input value={f.pointDepart} onChange={e => u("pointDepart", e.target.value)}/>
        </div>
      </div>
      <div className="field"><label>Animateur</label>
        <input value={f.animateur || ""} onChange={e => u("animateur", e.target.value)}/>
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={f.complet} onChange={e => u("complet", e.target.checked)}/> Complet
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={f.annule} onChange={e => u("annule", e.target.checked)}/> Annulée
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave({ ...f, groupes: f.groupesText.split(",").map(x => x.trim()).filter(Boolean) })}>Enregistrer</button>
      </div>
    </div>
  )
}
