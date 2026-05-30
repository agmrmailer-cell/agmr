'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import HelpTip from '@/components/ui/HelpTip'

// ── Filtre discipline multi-sélection ─────────────────────────
function DisciplineFilter({ disciplines, counts, selected, onChange }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef()

  // Fermer au clic extérieur
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = disciplines.filter(d =>
    !search || d.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (d) => {
    const next = new Set(selected)
    next.has(d) ? next.delete(d) : next.add(d)
    onChange(next)
  }
  const allSelected = selected.size === 0
  const total       = disciplines.reduce((s, d) => s + (counts[d] ?? 0), 0)

  // Label du bouton déclencheur
  const triggerLabel = allSelected
    ? `Toutes`
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} disciplines`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bouton déclencheur — style admin-filter-chip */}
      <button
        className={`admin-filter-chip ${!allSelected ? 'active' : ''}`}
        onClick={() => setOpen(o => !o)}
        style={{ gap: 8 }}
      >
        <span>{triggerLabel}</span>
        <span>{allSelected ? total : [...selected].reduce((s, d) => s + (counts[d] ?? 0), 0)}</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={11}/>
      </button>

      {/* Panel déroulant */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: 'var(--bg-card)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-md)',
          width: 300, maxHeight: 360, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Recherche */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line-soft)' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              autoFocus
              style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: '0.88rem', background: 'var(--bg-elev)', color: 'var(--ink)' }}
            />
          </div>

          {/* Option "Toutes" */}
          <button
            onClick={() => { onChange(new Set()); setSearch('') }}
            style={{ padding: '9px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--line-soft)', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit', color: allSelected ? 'var(--accent)' : 'var(--ink-mute)', fontWeight: allSelected ? 700 : 400, display: 'flex', justifyContent: 'space-between' }}
          >
            <span>Toutes les disciplines</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{total}</span>
          </button>

          {/* Liste avec scroll */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(d => {
              const isSel = selected.has(d)
              return (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ink-soft)', background: isSel ? 'var(--accent-tint)' : 'transparent', transition: 'background .1s' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-elev)' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                >
                  <input type="checkbox" checked={isSel} onChange={() => toggle(d)} style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }}/>
                  <span style={{ flex: 1 }}>{d}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-mute)', background: 'var(--bg-deep)', borderRadius: 99, padding: '1px 7px', fontWeight: 600 }}>{counts[d] ?? 0}</span>
                </label>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '12px 14px', color: 'var(--ink-mute)', fontSize: '0.88rem' }}>Aucun résultat</div>
            )}
          </div>

          {/* Pied : effacer */}
          {!allSelected && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { onChange(new Set()); setSearch('') }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}>
                ✕ Effacer la sélection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DAYS = ["lundi","mardi","mercredi","jeudi","vendredi","samedi"]
const DISCS = ["pilates","yoga","stretch","senior","renfo","step","fitball","pound","low","tendance"]

function mapCourse(c) {
  return {
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
    complet: c.complet ?? false,
    tag: c.tag ?? '',
    recurrence: c.recurrence ?? { type: 'weekly' },
  }
}

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

function exportPDF(courses) {
  const rows = courses.map(c =>
    `<tr><td class="cap">${c.jour}</td><td>${c.heureDebut} – ${c.heureFin}</td><td>${c.discipline}</td><td>${c.animateur}</td><td>${c.salle}</td></tr>`
  ).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Planning Gym — AGMR</title>
<style>
  body{font-family:Georgia,serif;padding:32px;color:#1a1a1a}
  h1{font-size:1.5rem;margin:0 0 4px}
  .sub{font-family:Arial,sans-serif;font-size:0.78rem;color:#666;margin-bottom:24px}
  table{width:100%;border-collapse:collapse}
  th{background:#1e3528;color:#fff;padding:9px 14px;text-align:left;font-family:Arial,sans-serif;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em}
  td{padding:9px 14px;border-bottom:1px solid #e8e4dc;font-size:0.88rem}
  tr:nth-child(even) td{background:#f9f7f3}
  .cap{text-transform:capitalize}
</style></head><body>
<h1>Planning Gym — AGMR</h1>
<div class="sub">Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${courses.length} créneaux</div>
<table>
<thead><tr><th>Jour</th><th>Horaire</th><th>Discipline</th><th>Animateur</th><th>Salle</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`
  const w = window.open('', '_blank', 'width=920,height=680')
  w.document.write(html)
  w.document.close()
  w.print()
}

export default function AdminGymSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [fd, setFd]         = useState("all")
  const [fdDiscs, setFdDiscs] = useState(new Set()) // Set vide = toutes
  const supabase = useMemo(() => createClient(), [])

  const fetchCourses = useCallback(async () => {
    const { data, error } = await supabase
      .from('gym_courses')
      .select('*')
      .order('jour')
    if (!error) {
      setItems(data.map(mapCourse))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let ignore = false
    supabase
      .from('gym_courses')
      .select('*')
      .order('jour')
      .then(({ data, error }) => {
        if (ignore) return
        if (!error) setItems(data.map(mapCourse))
        setLoading(false)
      })
    return () => { ignore = true }
  }, [supabase])

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
      complet: item.complet ?? false,
      tag: item.tag || null,
      recurrence: item.recurrence ?? { type: 'weekly' },
    }
    if (item.id) {
      await supabase.from('gym_courses').update(payload).eq('id', item.id)
      await logActivity(supabase, { message: `Cours modifié — ${item.discipline} ${item.jour} ${item.heureDebut}`, section: 'gym', action: 'update' })
    } else {
      await supabase.from('gym_courses').insert(payload)
      await logActivity(supabase, { message: `Nouveau cours — ${item.discipline} ${item.jour} ${item.heureDebut}`, section: 'gym', action: 'create' })
    }
    setEditing(null)
    fetchCourses()
  }

  const del = async (id) => {
    if (!confirm("Supprimer ce créneau ?")) return
    const course = items.find(i => i.id === id)
    await supabase.from('gym_courses').delete().eq('id', id)
    await logActivity(supabase, { message: `Cours supprimé — ${course?.discipline ?? ''} ${course?.jour ?? ''}`, section: 'gym', action: 'delete' })
    fetchCourses()
  }

  const tog = async (id, actif) => {
    await supabase.from('gym_courses').update({ actif: !actif }).eq('id', id)
    fetchCourses()
  }

  const disciplines = [...new Set(items.map(i => i.discipline))].sort()
  const dayCounts = DAYS.reduce((acc, day) => {
    acc[day] = items.filter(i => i.jour === day).length
    return acc
  }, {})
  const disciplineCounts = disciplines.reduce((acc, discipline) => {
    acc[discipline] = items.filter(i => i.discipline === discipline).length
    return acc
  }, {})

  const filtered = items
    .filter(i => fd === "all" || i.jour === fd)
    .filter(i => fdDiscs.size === 0 || fdDiscs.has(i.discipline))

  const blank = { jour: "lundi", heureDebut: "09:00", heureFin: "10:00", discipline: "", animateur: "", salle: "", niveau: "tous", actif: true, disc: "pilates", complet: false, tag: '', recurrence: { type: 'weekly' } }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Planning Gym <HelpTip text="Gérez ici tous les créneaux de cours de la section gym. Chaque ligne correspond à un cours récurrent (ex : Pilates lundi 9h-10h). Vous pouvez ajouter, modifier, activer/désactiver ou supprimer des créneaux." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>{items.length} créneaux · {items.filter(i => i.actif).length} actifs — <strong style={{ color: "var(--green)" }}>données Supabase</strong></p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => exportPDF(filtered)}>
            <Icon name="download" size={14}/> Exporter PDF
          </button>
          <button className="btn btn-primary" onClick={() => setEditing(blank)}>
            <Icon name="plus" size={16}/> Ajouter un créneau <HelpTip text="Ouvre le formulaire pour créer un nouveau cours. Renseignez le jour, les horaires, la discipline, l'animateur et la salle. Le champ Récurrence définit si le cours a lieu chaque semaine, une semaine sur deux, etc." position="bottom" />
          </button>
        </div>
      </div>

      <div className="admin-filter-panel">
        <div className="admin-filter-row">
          <div className="admin-filter-label">Jour</div>
          <div className="admin-filter-options" role="group" aria-label="Filtrer par jour">
            <button className={`admin-filter-chip ${fd === "all" ? "active" : ""}`} onClick={() => setFd("all")} aria-pressed={fd === "all"}>
              Tous <span>{items.length}</span>
            </button>
            {DAYS.map(d => (
              <button key={d} className={`admin-filter-chip ${fd === d ? "active" : ""}`} onClick={() => setFd(d)} aria-pressed={fd === d}>
                <span className="admin-filter-cap">{d}</span> <span>{dayCounts[d] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="admin-filter-row" style={{ alignItems: 'center' }}>
          <div className="admin-filter-label">Discipline</div>
          <DisciplineFilter
            disciplines={disciplines}
            counts={disciplineCounts}
            selected={fdDiscs}
            onChange={setFdDiscs}
          />
        </div>
      </div>

      <table className="tbl">
        <thead><tr><th>Jour</th><th>Heure</th><th>Discipline</th><th>Animateur</th><th>Salle</th><th>Récurrence</th><th>Tag</th><th>Actif</th><th></th></tr></thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id} style={{ opacity: c.actif ? 1 : 0.5 }}>
              <td style={{ textTransform: "capitalize" }}>{c.jour}</td>
              <td style={{ whiteSpace: "nowrap" }}>{c.heureDebut} – {c.heureFin}</td>
              <td><strong>{c.discipline}</strong>{c.complet && <span style={{ marginLeft: 6, fontSize: "0.72rem", background: "#dc2626", color: "#fff", borderRadius: 4, padding: "1px 5px" }}>Complet</span>}</td>
              <td>{c.animateur}</td>
              <td>{c.salle}</td>
              <td style={{ fontSize: "0.8rem", color: "var(--ink-mute)", whiteSpace: "nowrap" }}>
                {recurrenceShort(c.recurrence)}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                {c.tag === 'nouveau' && <span style={{ fontSize: "0.72rem", background: "#0891b2", color: "#fff", borderRadius: 4, padding: "1px 5px" }}>Nouveau</span>}
                {c.tag === 'apa' && <span style={{ fontSize: "0.72rem", background: "#ca8a04", color: "#fff", borderRadius: 4, padding: "1px 5px" }}>APA</span>}
              </td>
              <td><button className={`switch ${c.actif ? "on" : ""}`} onClick={() => tog(c.id, c.actif)}/></td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="icon-btn" onClick={() => setEditing(c)}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(c.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--ink-mute)", padding: 32 }}>Aucun créneau pour cette sélection</td></tr>
          )}
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

// ── Recurrence helpers ──────────────────────────────────────────
const ORD = ['1er','2e','3e','4e']

function recurrenceShort(rec) {
  if (!rec || rec.type === 'weekly') return 'Toutes les sem.'
  switch (rec.type) {
    case 'biweekly':     return '1 sem. / 2'
    case 'monthly_nth':  return `${ORD[rec.weekOfMonth-1] ?? rec.weekOfMonth+'e'} du mois`
    case 'monthly_last': return 'Dernier du mois'
    case 'custom':       return `1 sem. / ${rec.interval}`
    default: return '—'
  }
}

function RecurrenceSelect({ value, jour, onChange }) {
  const rec = value ?? { type: 'weekly' }
  const today = new Date().toISOString().slice(0, 10)

  // Map rec object → select value string
  const selectVal = (() => {
    switch (rec.type) {
      case 'biweekly':     return 'biweekly'
      case 'monthly_nth':  return `monthly_${rec.weekOfMonth}`
      case 'monthly_last': return 'monthly_last'
      case 'custom':       return 'custom'
      default:             return 'weekly'
    }
  })()

  const handleType = (v) => {
    if (v === 'weekly')       { onChange({ type: 'weekly' }); return }
    if (v === 'biweekly')     { onChange({ type: 'biweekly', interval: 2, refDate: rec.refDate ?? today }); return }
    if (v === 'monthly_last') { onChange({ type: 'monthly_last' }); return }
    if (v.startsWith('monthly_')) {
      const n = parseInt(v.replace('monthly_', ''))
      onChange({ type: 'monthly_nth', weekOfMonth: n }); return
    }
    if (v === 'custom') { onChange({ type: 'custom', interval: rec.interval ?? 3, refDate: rec.refDate ?? today }) }
  }

  const needsRef = rec.type === 'biweekly' || rec.type === 'custom'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select value={selectVal} onChange={e => handleType(e.target.value)}>
        <option value="weekly">Toutes les semaines</option>
        <option value="biweekly">1 semaine sur 2</option>
        <option value="monthly_1">Le 1er {jour} du mois</option>
        <option value="monthly_2">Le 2e {jour} du mois</option>
        <option value="monthly_3">Le 3e {jour} du mois</option>
        <option value="monthly_4">Le 4e {jour} du mois</option>
        <option value="monthly_last">Le dernier {jour} du mois</option>
        <option value="custom">Personnalisé (toutes les N semaines)…</option>
      </select>

      {needsRef && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label style={{ fontSize: '0.78rem' }}>Date de référence <span style={{ fontWeight: 400, color: 'var(--ink-mute)' }}>(une semaine où le cours a lieu)</span></label>
            <input type="date" value={rec.refDate ?? ''} onChange={e => onChange({ ...rec, refDate: e.target.value })}/>
          </div>
          {rec.type === 'custom' && (
            <div className="field" style={{ width: 130, margin: 0 }}>
              <label style={{ fontSize: '0.78rem' }}>Toutes les</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min={2} max={26} value={rec.interval ?? 3} style={{ width: 56 }}
                  onChange={e => onChange({ ...rec, interval: Math.max(2, parseInt(e.target.value) || 2) })}/>
                <span style={{ fontSize: '0.88rem', color: 'var(--ink-mute)' }}>sem.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
      <div className="field"><label>Discipline <HelpTip text="Le nom du cours tel qu'il apparaîtra dans le planning (ex : Pilates, Yoga, Gym douce). Respectez la même orthographe pour grouper les cours de même type." position="right" /></label><input value={f.discipline} onChange={e => u("discipline", e.target.value)}/></div>
      <div className="row-2">
        <div className="field"><label>Animateur</label><input value={f.animateur} onChange={e => u("animateur", e.target.value)}/></div>
        <div className="field"><label>Salle</label><input value={f.salle} onChange={e => u("salle", e.target.value)}/></div>
      </div>
      <div className="row-2">
        <div className="field"><label>Couleur (disc)</label>
          <select value={f.disc} onChange={e => u("disc", e.target.value)}>
            {DISCS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field"><label>Tag</label>
          <select value={f.tag ?? ''} onChange={e => u("tag", e.target.value)}>
            <option value="">— Aucun —</option>
            <option value="nouveau">Nouveau</option>
            <option value="apa">APA</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Récurrence</label>
        <RecurrenceSelect value={f.recurrence} jour={f.jour} onChange={v => u("recurrence", v)}/>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.92rem" }}>
          <input type="checkbox" checked={f.actif} onChange={e => u("actif", e.target.checked)}/> Créneau actif
        </label>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.92rem" }}>
          <input type="checkbox" checked={f.complet ?? false} onChange={e => u("complet", e.target.checked)}/> Complet
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}
