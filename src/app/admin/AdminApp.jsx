'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AGMRLogo from '@/components/ui/AGMRLogo'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import { gymCourses, randoSorties, news, sejours, bureau } from '@/data'
import { formatDateFR, labelType, catLabel } from '@/utils/format'
import { relativeTime } from '@/lib/activity'
import AdminGymSection from './sections/AdminGymSection'
import AdminActuSection from './sections/AdminActuSection'
import AdminRandoSection from './sections/AdminRandoSection'
import AdminGalerieSection from './sections/AdminGalerieSection'
import AdminHomeSection from './sections/AdminHomeSection'
import AdminGymPageSection from './sections/AdminGymPageSection'
import AdminRandoPageSection from './sections/AdminRandoPageSection'
import AdminNordiquePageSection from './sections/AdminNordiquePageSection'
import AdminSantePageSection from './sections/AdminSantePageSection'
import AdminAssoPageSection from './sections/AdminAssoPageSection'
import AdminComiteSection from './sections/AdminComiteSection'
import AdminAGSection from './sections/AdminAGSection'
import AdminAccessSection from './sections/AdminAccessSection'
import AdminVacancesSection from './sections/AdminVacancesSection'
import AdminSejoursSection from './sections/AdminSejoursSection'
import AdminTarifsSection from './sections/AdminTarifsSection'
import AdminGuideSection from './sections/AdminGuideSection'
import AdminBackupSection from './sections/AdminBackupSection'

// ── Sidebar ───────────────────────────────────────────────────
function AdminSidebar({ section, setSection, user, canAccess, isSuperAdmin }) {
  const router = useRouter()

  const allItems = [
    { id: "dash",          label: "Tableau de bord",    icon: "home",          always: true },
    { divider: "Activités" },
    { id: "home",          label: "Page principale",    icon: "file" },
    { id: "gym-page",      label: "Page Gym",           icon: "leaf" },
    { id: "gym",           label: "Planning Gym",       icon: "calendar" },
    { id: "vacances",      label: "Vacances scolaires", icon: "calendar" },
    { id: "rando-page",    label: "Page Randonnée",     icon: "mountain" },
    { id: "rando",         label: "Planning Rando",     icon: "mountain" },
    { id: "nordique-page", label: "Marche nordique",    icon: "leaf" },
    { id: "sante-page",    label: "Santé par le sport", icon: "accessibility" },
    { divider: "Contenus" },
    { id: "sejours",       label: "Séjours",            icon: "pin" },
    { id: "actu",          label: "Actualités",         icon: "file" },
    { id: "galerie",       label: "Galerie",            icon: "image" },
    { divider: "Association" },
    { id: "asso-page",     label: "Présentation",       icon: "file" },
    { id: "comite",        label: "Comité directeur",   icon: "user" },
    { id: "ag",            label: "Assemblée générale", icon: "file" },
    { id: "tarifs",        label: "Tarifs",             icon: "file" },
    { divider: "" },
    { id: "guide",         label: "Guide d'utilisation", icon: "file",     always: true },
    { id: "settings",      label: "Paramètres",          icon: "settings", always: true },
    ...(isSuperAdmin ? [{ id: "access", label: "Gestion des accès", icon: "user", always: true }] : []),
    ...(isSuperAdmin ? [{ id: "backup", label: "Sauvegarde", icon: "download", always: true }] : []),
  ]

  // IDs visibles (always + ceux autorisés)
  const visibleIds = new Set(
    allItems.filter(it => it.id && (it.always || canAccess(it.id))).map(it => it.id)
  )

  // Ne conserver un divider que s'il précède au moins un item visible
  const items = allItems.reduce((acc, it, i, arr) => {
    if (it.divider !== undefined) {
      const hasVisible = arr.slice(i + 1).some(x => x.divider !== undefined ? false : x.id && visibleIds.has(x.id))
      if (hasVisible) acc.push(it)
    } else if (!it.id || visibleIds.has(it.id)) {
      acc.push(it)
    }
    return acc
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="admin-side">
      <div className="admin-side-brand">
        <AGMRLogo size={52} light={true} withTagline={false}/>
        <div className="asb-text">
          <div className="asb-1">Admin</div>
          <div className="asb-2">Back-office</div>
        </div>
      </div>
      <nav>
        {items.map((it, i) => {
          if (it.divider !== undefined) {
            return it.divider ? (
              <div key={`div-${i}`} style={{ padding: "14px 24px 4px", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#4a5a4d", fontWeight: 700 }}>
                {it.divider}
              </div>
            ) : (
              <div key={`sep-${i}`} style={{ margin: "8px 20px", borderTop: "1px solid #1f2a23" }}/>
            )
          }
          return (
            <a key={it.id} href="#" className={section === it.id ? "active" : ""} onClick={e => { e.preventDefault(); setSection(it.id) }}>
              <Icon name={it.icon} size={16}/> {it.label}
            </a>
          )
        })}
      </nav>
      <div className="admin-side-foot">
        <div style={{ marginBottom: 8 }}>
          Connecté en tant que<br/>
          <strong style={{ color: "#fff" }}>{user?.email}</strong>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="home" size={14}/> Retour au site
          </a>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#8b9089", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0, fontFamily: "inherit", fontSize: "0.82rem" }}>
            <Icon name="logout" size={14}/> Se déconnecter
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ setSection }) {
  const [kpi, setKpi]           = useState(null)
  const [activity, setActivity] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [gym, rando, sejours, log] = await Promise.all([
        supabase.from('gym_courses').select('id', { count: 'exact' }).eq('actif', true),
        supabase.from('rando_sorties').select('date').gte('date', new Date().toISOString().slice(0,10)).eq('annule', false).order('date'),
        supabase.from('sejours').select('statut'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8),
      ])
      const prochaine = rando.data?.[0]?.date
      const prochaineLabel = prochaine
        ? `Prochaine ${prochaine.slice(8,10)}/${prochaine.slice(5,7)}`
        : '—'
      const sejoursTotal = sejours.data?.filter(s => s.statut !== 'passe').length ?? 0
      const sejoursOuverts = sejours.data?.filter(s => s.statut === 'ouvert').length ?? 0
      setKpi([
        [String(gym.count ?? 0), "Cours gym actifs", ""],
        [String(rando.data?.length ?? 0), "Sorties à venir", prochaineLabel],
        [String(sejoursTotal), "Séjours programmés", `${sejoursOuverts} ouvert${sejoursOuverts > 1 ? 's' : ''}`],
      ])
      setActivity(log.data ?? [])
    }
    load()
  }, [])

  return (
    <>
      <div className="admin-head">
        <div><h1>Tableau de bord</h1><p className="muted" style={{ margin: 0 }}>Vue d'ensemble · saison 2025-2026</p></div>
        <div style={{ fontSize: "0.86rem", color: "var(--ink-mute)" }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
      </div>
      <div className="kpi-grid">
        {(kpi ?? [["…","Cours gym actifs",""],["…","Sorties à venir",""],["…","Séjours programmés",""]]).map(([n,l,t]) => (
          <div key={l} className="kpi-tile">
            <div className="kpi-num">{n}</div>
            <div className="kpi-lbl">{l}</div>
            {t && <div className="kpi-trend">{t}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 24 }}>
          <h3 style={{ fontFamily: "var(--sans)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Activité récente</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.94rem" }}>
            {activity === null && (
              <li style={{ color: "var(--ink-mute)", padding: "10px 0" }}>Chargement…</li>
            )}
            {activity !== null && activity.length === 0 && (
              <li style={{ color: "var(--ink-mute)", padding: "10px 0" }}>Aucune activité pour l'instant.</li>
            )}
            {(activity ?? []).map((a) => (
              <li key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-mute)", background: "var(--bg-deep)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>{a.section}</span>
                  {a.message}
                </span>
                <span className="muted" style={{ fontSize: "0.84rem", whiteSpace: "nowrap", marginLeft: 16 }}>{relativeTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 24 }}>
          <h3 style={{ fontFamily: "var(--sans)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Actions rapides</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {[["gym","Ajouter un cours"],["rando","Programmer une sortie"],["actu","Publier une actu"],["galerie","Créer un album"]].map(([id,label]) => (
              <button key={id} className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => setSection(id)}>
                <Icon name="plus" size={14}/> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Modal ─────────────────────────────────────────────────────
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

// ── Admin Gym ─────────────────────────────────────────────────
function AdminGym() {
  const [items, setItems] = useState(gymCourses)
  const [editing, setEditing] = useState(null)
  const [fd, setFd] = useState("all")
  const days = ["lundi","mardi","mercredi","jeudi","vendredi","samedi"]
  const filtered = items.filter(i => fd === "all" || i.jour === fd)
  const save = item => { if (item.id) setItems(items.map(i => i.id === item.id ? item : i)); else setItems([...items, { ...item, id: "g" + Date.now() }]); setEditing(null) }
  const del = id => { if (confirm("Supprimer ce créneau ?")) setItems(items.filter(i => i.id !== id)) }
  const tog = id => setItems(items.map(i => i.id === id ? { ...i, actif: !i.actif } : i))
  return (
    <>
      <div className="admin-head">
        <div><h1>Planning Gym</h1><p className="muted" style={{ margin: 0 }}>{items.length} créneaux · {items.filter(i => i.actif).length} actifs</p></div>
        <button className="btn btn-primary" onClick={() => setEditing({ jour: "lundi", heureDebut: "09:00", heureFin: "10:00", discipline: "", animateur: "", salle: "", niveau: "tous", actif: true, disc: "pilates" })}>
          <Icon name="plus" size={16}/> Ajouter un créneau
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button className={`chip ${fd === "all" ? "active" : ""}`} onClick={() => setFd("all")}>Tous</button>
        {days.map(d => <button key={d} className={`chip ${fd === d ? "active" : ""}`} onClick={() => setFd(d)} style={{ textTransform: "capitalize" }}>{d}</button>)}
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
              <td><button className={`switch ${c.actif ? "on" : ""}`} onClick={() => tog(c.id)}/></td>
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
        <div className="field"><label>Jour</label><select value={f.jour} onChange={e => u("jour", e.target.value)}>{["lundi","mardi","mercredi","jeudi","vendredi","samedi"].map(d => <option key={d}>{d}</option>)}</select></div>
        <div className="field"><label>Niveau</label><select value={f.niveau} onChange={e => u("niveau", e.target.value)}><option value="tous">Tous niveaux</option><option value="débutant">Débutant</option><option value="intermédiaire">Intermédiaire</option><option value="senior">Senior</option></select></div>
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

// ── Admin Rando ───────────────────────────────────────────────
function AdminRando() {
  const [items, setItems] = useState(randoSorties)
  const [editing, setEditing] = useState(null)
  const save = it => { if (it.id) setItems(items.map(i => i.id === it.id ? it : i)); else setItems([...items, { ...it, id: "r" + Date.now() }]); setEditing(null) }
  const del = id => { if (confirm("Supprimer cette sortie ?")) setItems(items.filter(i => i.id !== id)) }
  const togC = id => setItems(items.map(i => i.id === id ? { ...i, complet: !i.complet } : i))
  return (
    <>
      <div className="admin-head">
        <div><h1>Planning Randonnée & Nordique</h1><p className="muted" style={{ margin: 0 }}>{items.length} sorties</p></div>
        <button className="btn btn-primary" onClick={() => setEditing({ date: "2026-06-01", type: "rando-jeudi", titre: "", groupes: [], pointDepart: "Parking Leclerc", heureDepart: "13:45", complet: false, annule: false })}>
          <Icon name="plus" size={16}/> Programmer une sortie
        </button>
      </div>
      <table className="tbl">
        <thead><tr><th>Date</th><th>Type</th><th>Titre</th><th>Groupes</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {items.sort((a,b) => a.date.localeCompare(b.date)).map(s => (
            <tr key={s.id}>
              <td><strong>{formatDateFR(s.date)}</strong><div className="muted" style={{ fontSize: "0.82rem" }}>{s.heureDepart}</div></td>
              <td><span className="rando-tag">{labelType(s.type)}</span></td>
              <td>{s.titre}{s.distanceKm && <div className="muted" style={{ fontSize: "0.82rem" }}>{s.distanceKm} km{s.denivele ? ` · ${s.denivele}m` : ""}</div>}</td>
              <td>{s.groupes.join(", ")}</td>
              <td>
                {s.complet && <span className="badge badge-full">Complet</span>}
                {s.annule && <span className="badge badge-cancel">Annulée</span>}
                {!s.complet && !s.annule && <span className="badge badge-ok">Ouverte</span>}
              </td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="btn btn-sm btn-ghost" onClick={() => togC(s.id)}>{s.complet ? "Rouvrir" : "Complet"}</button>
                <button className="icon-btn" onClick={() => setEditing(s)} style={{ marginLeft: 4 }}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(s.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
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
        <div className="field"><label>Date</label><input type="date" value={f.date} onChange={e => u("date", e.target.value)}/></div>
        <div className="field"><label>Type</label>
          <select value={f.type} onChange={e => u("type", e.target.value)}>
            {[["rando-jeudi","Rando jeudi"],["rando-dimanche","Rando dimanche"],["nordique-mardi","Nordique mardi"],["nordique-samedi","Nordique samedi"],["sortie-journee","Sortie journée"],["sejour","Séjour"],["nocturne","Nocturne"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Titre</label><input value={f.titre} onChange={e => u("titre", e.target.value)}/></div>
      <div className="row-3">
        <div className="field"><label>Distance (km)</label><input type="number" value={f.distanceKm || ""} onChange={e => u("distanceKm", e.target.value ? Number(e.target.value) : undefined)}/></div>
        <div className="field"><label>Dénivelé (m)</label><input type="number" value={f.denivele || ""} onChange={e => u("denivele", e.target.value ? Number(e.target.value) : undefined)}/></div>
        <div className="field"><label>Heure départ</label><input type="time" value={f.heureDepart} onChange={e => u("heureDepart", e.target.value)}/></div>
      </div>
      <div className="row-2">
        <div className="field"><label>Groupes (virgule)</label><input value={f.groupesText} onChange={e => u("groupesText", e.target.value)} placeholder="Gr 1, Gr 2A, Tous"/></div>
        <div className="field"><label>Point de départ</label><input value={f.pointDepart} onChange={e => u("pointDepart", e.target.value)}/></div>
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={f.complet} onChange={e => u("complet", e.target.checked)}/> Complet</label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={f.annule} onChange={e => u("annule", e.target.checked)}/> Annulée</label>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave({ ...f, groupes: f.groupesText.split(",").map(x => x.trim()).filter(Boolean) })}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Admin Actualités ──────────────────────────────────────────
function AdminActu() {
  const [items, setItems] = useState(news)
  const [editing, setEditing] = useState(null)
  const save = it => { if (it.id) setItems(items.map(i => i.id === it.id ? it : i)); else setItems([{ ...it, id: "n" + Date.now() }, ...items]); setEditing(null) }
  const del = id => { if (confirm("Supprimer cet article ?")) setItems(items.filter(i => i.id !== id)) }
  return (
    <>
      <div className="admin-head">
        <div><h1>Actualités</h1><p className="muted" style={{ margin: 0 }}>{items.length} articles</p></div>
        <button className="btn btn-primary" onClick={() => setEditing({ cat: "asso", date: new Date().toISOString().slice(0,10), title: "", excerpt: "" })}>
          <Icon name="plus" size={16}/> Nouvel article
        </button>
      </div>
      <table className="tbl">
        <thead><tr><th>Date</th><th>Catégorie</th><th>Titre</th><th>Extrait</th><th></th></tr></thead>
        <tbody>
          {items.map(n => (
            <tr key={n.id}>
              <td>{formatDateFR(n.date)}</td>
              <td><span className={`news-cat news-cat-${n.cat}`}>{catLabel(n.cat)}</span></td>
              <td><strong>{n.title}</strong></td>
              <td className="muted" style={{ fontSize: "0.88rem", maxWidth: 280 }}>{n.excerpt.slice(0, 70)}…</td>
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
              <div className="field"><label>Date</label><input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })}/></div>
            </div>
            <div className="field"><label>Titre</label><input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}/></div>
            <div className="field"><label>Contenu</label><textarea rows={5} value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}/></div>
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

// ── Admin Séjours ─────────────────────────────────────────────
function AdminSejours() {
  const [items] = useState(sejours)
  return (
    <>
      <div className="admin-head">
        <div><h1>Séjours</h1><p className="muted" style={{ margin: 0 }}>{items.length} séjours</p></div>
        <button className="btn btn-primary"><Icon name="plus" size={16}/> Nouveau séjour</button>
      </div>
      <table className="tbl">
        <thead><tr><th>Séjour</th><th>Dates</th><th>Transport</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id}>
              <td><strong>{s.titre}</strong></td>
              <td>{s.dates}</td>
              <td>{s.transport}</td>
              <td>
                {s.statut === "ouvert" && <span className="badge badge-ok">Ouvert</span>}
                {s.statut === "complet" && <span className="badge badge-full">Complet</span>}
                {s.statut === "passe" && <span className="badge" style={{ background: "var(--bg-deep)", color: "var(--ink-soft)" }}>Terminé</span>}
              </td>
              <td style={{ textAlign: "right" }}>
                <button className="icon-btn"><Icon name="edit" size={14}/></button>
                <button className="icon-btn" style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ── Admin Galerie ─────────────────────────────────────────────
function AdminGalerie() {
  const albums = [
    { t: "Séjour Alsace", m: "14 photos · mai 2026", p: "a" },
    { t: "Marche nordique", m: "8 photos · avr. 2026", p: "b" },
    { t: "Cours de Pilates", m: "6 photos · avr. 2026", p: "c" },
    { t: "Pique-nique printemps", m: "24 photos · avr. 2026", p: "d" },
    { t: "Rando dimanche", m: "10 photos · avr. 2026", p: "e" },
    { t: "Stage Yoga", m: "18 photos · mars 2026", p: "f" },
  ]
  return (
    <>
      <div className="admin-head">
        <div><h1>Galerie</h1><p className="muted" style={{ margin: 0 }}>6 albums · ~80 photos</p></div>
        <button className="btn btn-primary"><Icon name="plus" size={16}/> Nouvel album</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {albums.map((a, i) => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
            <div className={`team-photo team-photo-${a.p}`} style={{ aspectRatio: "16/9", borderRadius: 0 }}/>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 600 }}>{a.t}</div>
              <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 12 }}>{a.m}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm btn-ghost"><Icon name="edit" size={12}/> Modifier</button>
                <button className="btn btn-sm btn-ghost"><Icon name="trash" size={12}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Admin Comité ──────────────────────────────────────────────
function AdminComite() {
  return (
    <>
      <div className="admin-head">
        <div><h1>Comité directeur</h1><p className="muted" style={{ margin: 0 }}>{bureau.length} membres</p></div>
        <button className="btn btn-primary"><Icon name="plus" size={16}/> Ajouter un membre</button>
      </div>
      <table className="tbl">
        <thead><tr><th>Membre</th><th>Rôle</th><th></th></tr></thead>
        <tbody>
          {bureau.map((b, i) => (
            <tr key={i}>
              <td><strong>{b.nom}</strong></td>
              <td>{b.role}</td>
              <td style={{ textAlign: "right" }}>
                <button className="icon-btn"><Icon name="edit" size={14}/></button>
                <button className="icon-btn" style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ── Admin Tarifs ──────────────────────────────────────────────
function AdminTarifs() {
  return (
    <>
      <div className="admin-head"><h1>Tarifs</h1></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {[["Tarifs Gym",["Adhésion association","Licence FFEPGV","1 cours gym / semaine","+ Pilates (par cours)","+ Yoga / Qi Gong (par cours)"]],["Tarifs Marche",["Adhésion association","Licence FFRP","Cotisation marche"]]].map(([titre,lignes]) => (
          <div key={titre} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 24 }}>
            <h3 style={{ marginBottom: 14, fontFamily: "var(--sans)", fontSize: "1.1rem", fontWeight: 700 }}>{titre}</h3>
            <div className="form">
              {lignes.map(l => <div key={l} className="field"><label>{l}</label><input type="number" placeholder="À confirmer"/></div>)}
              <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Enregistrer</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Admin Paramètres ──────────────────────────────────────────
function AdminSettings({ user }) {
  return (
    <>
      <div className="admin-head"><h1>Paramètres</h1></div>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 28, maxWidth: 640 }}>
        <h3 style={{ marginBottom: 16, fontFamily: "var(--sans)", fontSize: "1.1rem", fontWeight: 700 }}>Compte administrateur</h3>
        <div className="form">
          <div className="field"><label>Email</label><input defaultValue={user?.email} readOnly/></div>
          <div className="field"><label>Mot de passe</label><input type="password" defaultValue="••••••••" readOnly/></div>
          <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}>Modifier le mot de passe</button>
        </div>
      </div>
    </>
  )
}

// ── CSS Admin ─────────────────────────────────────────────────
const ADMIN_CSS = `
.admin-shell { display: grid; grid-template-columns: 248px 1fr; min-height: 100vh; background: var(--bg); }
.admin-side { background: #0f1813; color: #d2cdbf; padding: 26px 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
.admin-side-brand { padding: 24px 24px 22px; border-bottom: 1px solid #1f2a23; margin-bottom: 14px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
.asb-text .asb-1 { font-family: var(--serif); font-size: 1.4rem; color: #fff; font-weight: 600; line-height: 1; }
.asb-text .asb-2 { font-size: 0.7rem; color: #8b9089; letter-spacing: 0.16em; text-transform: uppercase; margin-top: 5px; }
.admin-side nav { display: flex; flex-direction: column; gap: 1px; }
.admin-side nav a { padding: 11px 24px; color: #d2cdbf; text-decoration: none; font-size: 0.94rem; display: flex; align-items: center; gap: 12px; border-left: 3px solid transparent; cursor: pointer; }
.admin-side nav a:hover { background: rgba(255,255,255,0.04); color: #fff; }
.admin-side nav a.active { background: rgba(184,69,31,0.18); color: #fff; border-left-color: var(--accent); }
.admin-side-foot { margin-top: auto; padding: 18px 24px; border-top: 1px solid #1f2a23; font-size: 0.82rem; color: #8b9089; }
.admin-side-foot a { color: #8b9089; display: flex; align-items: center; gap: 8px; text-decoration: none; }
.admin-side-foot a:hover { color: #fff; }
.admin-main { padding: 36px 44px; overflow-y: auto; }
.admin-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; padding-bottom: 22px; border-bottom: 1px solid var(--line); }
.admin-head h1 { font-size: 2.2rem; }
.kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 28px; }
.kpi-tile { background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); padding: 22px 24px; }
.kpi-num { font-family: var(--serif); font-size: 2.4rem; font-weight: 600; line-height: 1; }
.kpi-lbl { font-size: 0.78rem; color: var(--ink-mute); margin-top: 8px; letter-spacing: 0.08em; text-transform: uppercase; }
.kpi-trend { font-size: 0.86rem; color: var(--green); margin-top: 10px; }
.modal-back { position: fixed; inset: 0; background: rgba(15,20,12,0.6); display: grid; place-items: center; z-index: 200; padding: 20px; backdrop-filter: blur(4px); }
.modal { background: var(--bg-card); border-radius: var(--r-md); width: 100%; max-width: 600px; max-height: 92vh; overflow-y: auto; box-shadow: var(--sh-lg); }
.modal-head { padding: 22px 28px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }
.modal-head h3 { font-size: 1.4rem; }
.modal-body { padding: 26px 28px; }
.switch { position: relative; width: 44px; height: 24px; background: var(--line-strong); border-radius: 99px; border: none; cursor: pointer; transition: background 0.2s; }
.switch::after { content: ""; position: absolute; width: 18px; height: 18px; background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: transform 0.2s; }
.switch.on { background: var(--green); }
.switch.on::after { transform: translateX(20px); }
`

// ── App ───────────────────────────────────────────────────────
export default function AdminApp({ user, profile }) {
  const [section, setSection] = useState("dash")

  const isSuperAdmin = profile?.role === 'super_admin'

  // Un super_admin a accès à tout. Un admin classique seulement à ses permissions.
  const canAccess = (id) => isSuperAdmin || (profile?.permissions ?? []).includes(id)

  return (
    <>
      <style>{ADMIN_CSS}</style>
      <div className="admin-shell">
        <AdminSidebar
          section={section}
          setSection={setSection}
          user={user}
          canAccess={canAccess}
          isSuperAdmin={isSuperAdmin}
        />
        <div className="admin-main">
          {section === "dash"          && <Dashboard setSection={setSection}/>}
          {section === "gym"           && canAccess("gym")           && <AdminGymSection/>}
          {section === "vacances"      && canAccess("gym")           && <AdminVacancesSection/>}
          {section === "rando"         && canAccess("rando")         && <AdminRandoSection/>}
          {section === "sejours"       && canAccess("sejours")       && <AdminSejoursSection/>}
          {section === "actu"          && canAccess("actu")          && <AdminActuSection/>}
          {section === "galerie"       && canAccess("galerie")       && <AdminGalerieSection/>}
          {section === "home"          && canAccess("home")          && <AdminHomeSection/>}
          {section === "gym-page"      && canAccess("gym-page")      && <AdminGymPageSection/>}
          {section === "rando-page"    && canAccess("rando-page")    && <AdminRandoPageSection/>}
          {section === "nordique-page" && canAccess("nordique-page") && <AdminNordiquePageSection/>}
          {section === "sante-page"    && canAccess("sante-page")    && <AdminSantePageSection/>}
          {section === "asso-page"     && canAccess("asso-page")     && <AdminAssoPageSection/>}
          {section === "comite"        && canAccess("comite")        && <AdminComiteSection/>}
          {section === "ag"            && canAccess("ag")            && <AdminAGSection/>}
          {section === "tarifs"        && canAccess("tarifs")        && <AdminTarifsSection/>}
          {section === "guide"         && <AdminGuideSection/>}
          {section === "settings"      && <AdminSettings user={user}/>}
          {section === "access"        && isSuperAdmin               && <AdminAccessSection/>}
        </div>
      </div>
    </>
  )
}
