'use client'
import { useState, useEffect, useMemo } from 'react'
import { useHelp } from '@/lib/help-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AGMRLogo from '@/components/ui/AGMRLogo'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import { gymCourses, randoSorties, news, sejours, bureau } from '@/data'
import { formatDateFR, labelType, catLabel } from '@/utils/format'
import { relativeTime } from '@/lib/activity'
import AdminGymSection from './sections/AdminGymSection'
import AdminActuSection from './sections/AdminActuSection'
import AdminGalerieSection from './sections/AdminGalerieSection'
import AdminHomeSection from './sections/AdminHomeSection'
import AdminGymPageSection from './sections/AdminGymPageSection'
import AdminRandoPageSection from './sections/AdminRandoPageSection'
import AdminPlanningRandoPageSection from './sections/AdminPlanningRandoPageSection'
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
import AdminBannerSection from './sections/AdminBannerSection'
import AdminLinksSection from './sections/AdminLinksSection'
import AdminSiteTextsSection from './sections/AdminSiteTextsSection'
import AdminMembersPasswordSection from './sections/AdminMembersPasswordSection'
import { setEditModeCookie } from '@/components/editable/EditModeBar'

// Ouvre le site public en mode édition visuelle (textes modifiables en cliquant dessus)
function openVisualEditor(path = '/') {
  setEditModeCookie(true)
  window.location.href = path
}


// ── Navigation simplifiée ─────────────────────────────────────
// Chaque entrée du menu ouvre soit une section, soit un « groupe » (page de choix avec des cartes).
// Les identifiants de section restent ceux utilisés pour les droits d'accès.
function getNav(isSuperAdmin) {
  return [
    { id: 'dash', label: 'Accueil', icon: 'home', always: true },
    { id: 'visual-edit', label: 'Modifier le site', icon: 'edit', always: true, action: () => openVisualEditor('/'), highlight: true,
      desc: 'Cliquez directement sur les textes et les images du site pour les modifier.' },
    { id: 'hub:pages', label: 'Pages du site', icon: 'file',
      desc: 'Contenu des pages : textes, blocs, photos. Astuce : « Modifier sur le site » est souvent le plus simple.',
      children: [
        { id: 'home',       label: "Page d'accueil",             icon: 'home',          desc: 'Grande photo, 3 rubriques, philosophie, bandeaux', href: '/' },
        { id: 'gym-page',   label: 'Gym',                         icon: 'leaf',          desc: 'Présentation, disciplines, animateurs', href: '/activites/gym' },
        { id: 'rando-page', label: 'Marche (Rando & Nordique)',   icon: 'mountain',      desc: 'Randonnée, groupes du jeudi, marche nordique', href: '/activites/randonnee' },
        { id: 'sante-page', label: 'Santé',                       icon: 'accessibility', desc: "Prescri'Forme, Rando-Santé, témoignages", href: '/activites/sante' },
        { id: 'asso-page',  label: "L'association",              icon: 'user',          desc: 'Histoire, sections, gouvernance, affiliations', href: '/association' },
        { id: 'site-texts', label: 'Autres pages & pied de page', icon: 'file',          desc: "Contact, S'inscrire, mentions légales, pied de page…", href: '/contact' },
      ] },
    { id: 'hub:plannings', label: 'Plannings', icon: 'calendar',
      desc: 'Horaires des cours de gym et plannings des sorties de marche.',
      children: [
        { id: 'gym',                 label: 'Cours de gym',       icon: 'calendar', desc: 'Jours, horaires, salles, animateurs' },
        { id: 'vacances',            label: 'Vacances scolaires', icon: 'calendar', desc: 'Périodes sans cours de gym', perm: 'gym' },
        { id: 'planning-rando-page', label: 'Planning rando',     icon: 'mountain', desc: 'Liens vers les plannings (réservés aux adhérents)' },
      ] },
    { id: 'hub:news', label: 'Actualités', icon: 'file',
      desc: 'Annonces, séjours et message défilant en haut du site.',
      children: [
        { id: 'actu',    label: 'Annonces',          icon: 'file', desc: 'Actualités affichées sur le site' },
        { id: 'sejours', label: 'Séjours & sorties', icon: 'pin',  desc: 'Séjours, dates, statut, photo' },
        { id: 'banner',  label: "Bandeau d'info",    icon: 'info', desc: 'Message défilant en haut de toutes les pages', always: true },
      ] },
    { id: 'galerie', label: 'Photos', icon: 'image' },
    { id: 'links', label: 'Liens & documents', icon: 'file' },
    { id: 'hub:asso', label: 'Association', icon: 'user',
      desc: "Équipe dirigeante, documents d'assemblée générale et tarifs.",
      children: [
        { id: 'comite', label: 'Comité directeur',   icon: 'user', desc: 'Membres du bureau et photos' },
        { id: 'ag',     label: 'Assemblée générale', icon: 'file', desc: 'Comptes rendus et documents' },
        { id: 'tarifs', label: 'Tarifs',             icon: 'file', desc: 'Cotisations et licences' },
      ] },
    { id: 'hub:settings', label: 'Réglages & aide', icon: 'settings', bottom: true,
      desc: "Votre compte, le guide d'utilisation et l'administration.",
      children: [
        { id: 'guide',    label: "Guide d'utilisation", icon: 'file',     desc: 'Comment utiliser le back-office', always: true },
        { id: 'members-password', label: 'Mot de passe adhérents', icon: 'lock', desc: 'Accès à l\'Espace adhérents et au Planning Rando' },
        { id: 'settings', label: 'Mon compte',          icon: 'settings', desc: 'Mot de passe et informations', always: true },
        ...(isSuperAdmin ? [
          { id: 'access', label: 'Gestion des accès', icon: 'user',     desc: 'Comptes administrateurs et droits', always: true },
          { id: 'backup', label: 'Sauvegarde',        icon: 'download', desc: 'Sauvegardes et restauration', always: true },
        ] : []),
      ] },
  ]
}

// Droit d'accès à une entrée (section simple)
function allowed(item, canAccess) {
  return item.always || canAccess(item.perm ?? item.id)
}

// Entrées visibles du menu, avec seulement les sous-sections autorisées
function visibleNav(isSuperAdmin, canAccess) {
  return getNav(isSuperAdmin)
    .map(it => it.children ? { ...it, children: it.children.filter(c => allowed(c, canAccess)) } : it)
    .filter(it => it.children ? it.children.length > 0 : allowed(it, canAccess))
}

function parentOf(nav, sectionId) {
  return nav.find(it => it.children?.some(c => c.id === sectionId)) ?? null
}

// ── Page de groupe : cartes vers les sous-sections ────────────
function HubView({ hub, setSection }) {
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>{hub.label}</h1>
          {hub.desc && <p className="muted" style={{ margin: 0 }}>{hub.desc}</p>}
        </div>
      </div>
      <div className="hub-grid">
        {hub.children.map(c => (
          <div key={c.id} className="hub-card">
            <button type="button" className="hub-card-main" onClick={() => setSection(c.id)}>
              <span className="hub-card-icon"><Icon name={c.icon} size={20}/></span>
              <span>
                <strong>{c.label}</strong>
                {c.desc && <span className="hub-card-desc">{c.desc}</span>}
              </span>
            </button>
            {c.href && (
              <div className="hub-card-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openVisualEditor(c.href)}>
                  <Icon name="edit" size={13}/> Modifier sur le site
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSection(c.id)}>Formulaire</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Sidebar ───────────────────────────────────────────────────
function AdminSidebar({ section, setSection, user, canAccess, isSuperAdmin }) {
  const router = useRouter()
  const { helpMode, setHelpMode } = useHelp()
  const [bannerActive, setBannerActive] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.from('site_banners').select('id').eq('active', true).limit(1)
      .then(({ data }) => setBannerActive((data ?? []).length > 0))
  }, [section, supabase]) // re-check quand on change de section

  const items = visibleNav(isSuperAdmin, canAccess)
  const mainItems = items.filter(it => !it.bottom)
  const bottomItems = items.filter(it => it.bottom)

  const open = it => {
    if (it.action) return it.action()
    if (it.children) return setSection(it.children.length === 1 ? it.children[0].id : it.id)
    setSection(it.id)
  }
  const isActive = it => section === it.id || !!it.children?.some(c => c.id === section)

  const renderItem = it => (
    <a
      key={it.id}
      href="#"
      className={`${isActive(it) ? 'active' : ''}${it.highlight ? ' nav-highlight' : ''}`}
      onClick={e => { e.preventDefault(); open(it) }}
    >
      <Icon name={it.icon} size={16}/> {it.label}
      {(it.id === 'hub:news') && bannerActive && (
        <span title="Un bandeau d'info est actif" style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: "#e88a5a", color: "#fff", fontSize: "0.65rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>!</span>
      )}
    </a>
  )

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
        <div className="asb-2">Back-office</div>
      </div>
      <nav>
        {mainItems.map(renderItem)}
        {bottomItems.length > 0 && <div style={{ margin: "10px 20px", borderTop: "1px solid #1f2a23" }}/>}
        {bottomItems.map(renderItem)}
      </nav>
      <div className="admin-side-foot">
        <div style={{ marginBottom: 8 }}>
          Connecté en tant que<br/>
          <strong style={{ color: "#fff" }}>{user?.email}</strong>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Toggle aide */}
          <button
            onClick={() => setHelpMode(!helpMode)}
            title={helpMode ? "Désactiver les bulles d'aide" : "Activer les bulles d'aide"}
            style={{
              background: helpMode ? "rgba(184,69,31,0.22)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${helpMode ? "rgba(184,69,31,0.4)" : "#2a3a2d"}`,
              borderRadius: 6,
              color: helpMode ? "#e88a5a" : "#8b9089",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px",
              fontFamily: "inherit", fontSize: "0.82rem",
              width: "100%", transition: "all 0.2s",
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: helpMode ? "#e88a5a" : "#8b9089", color: "#fff", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</span>
            Bulles d&apos;aide {helpMode ? "ON" : "OFF"}
          </button>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="home" size={14}/> Retour au site
          </Link>
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
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const [gym, sejours, links, log] = await Promise.all([
        supabase.from('gym_courses').select('id', { count: 'exact' }).eq('actif', true),
        supabase.from('sejours').select('statut'),
        supabase.from('external_links').select('id', { count: 'exact' }).contains('zones', ['planning-rando']).eq('active', true),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8),
      ])
      const sejoursTotal = sejours.data?.filter(s => s.statut !== 'passe').length ?? 0
      const sejoursOuverts = sejours.data?.filter(s => s.statut === 'ouvert').length ?? 0
      setKpi([
        [String(gym.count ?? 0), "Cours gym actifs", ""],
        [String(links.count ?? 0), "Liens planning rando", "Spreadsheets"],
        [String(sejoursTotal), "Séjours programmés", `${sejoursOuverts} ouvert${sejoursOuverts > 1 ? 's' : ''}`],
      ])
      setActivity(log.data ?? [])
    }
    load()
  }, [supabase])

  return (
    <>
      <div className="admin-head">
        <div><h1>Tableau de bord</h1><p className="muted" style={{ margin: 0 }}>Vue d&apos;ensemble · saison 2025-2026</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: "0.86rem", color: "var(--ink-mute)" }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <button className="btn btn-primary" onClick={() => openVisualEditor("/")}>
            <Icon name="edit" size={15}/> Éditer le site en direct
          </button>
        </div>
      </div>
      <div className="kpi-grid">
        {(kpi ?? [["…","Cours gym actifs",""],["…","Liens planning rando",""],["…","Séjours programmés",""]]).map(([n,l,t]) => (
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
              <li style={{ color: "var(--ink-mute)", padding: "10px 0" }}>Aucune activité pour l&apos;instant.</li>
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
            {[["gym","Ajouter un cours"],["links","Ajouter un lien"],["actu","Publier une actu"],["galerie","Créer un album"]].map(([id,label]) => (
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
.admin-side nav a.nav-highlight { color: #f3b08e; font-weight: 600; }
.admin-side nav a.nav-highlight:hover { color: #fff; }
.admin-crumb { margin: -12px 0 18px; font-size: 0.86rem; color: var(--ink-mute); }
.admin-crumb a { color: var(--accent); text-decoration: none; font-weight: 600; }
.admin-crumb a:hover { text-decoration: underline; }
.hub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.hub-card { background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--r-md); display: flex; flex-direction: column; overflow: hidden; transition: border-color .15s, box-shadow .15s; }
.hub-card:hover { border-color: var(--accent-soft, var(--line-strong)); box-shadow: 0 6px 18px rgba(0,0,0,.06); }
.hub-card-main { display: flex; gap: 14px; align-items: flex-start; text-align: left; padding: 20px 22px; background: none; border: 0; cursor: pointer; font: inherit; color: var(--ink); flex: 1; }
.hub-card-main strong { display: block; font-size: 1.05rem; margin-bottom: 4px; }
.hub-card-desc { display: block; font-size: 0.86rem; color: var(--ink-mute); line-height: 1.45; }
.hub-card-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; background: var(--accent-tint); color: var(--accent); display: inline-flex; align-items: center; justify-content: center; }
.hub-card-actions { display: flex; gap: 8px; padding: 0 22px 18px 76px; flex-wrap: wrap; }

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
          {(() => {
            const nav = visibleNav(isSuperAdmin, canAccess)
            const hub = nav.find(it => it.id === section && it.children)
            if (hub) return <HubView hub={hub} setSection={setSection}/>
            const parent = parentOf(nav, section)
            if (!parent || parent.children.length < 2) return null
            const current = parent.children.find(c => c.id === section)
            return (
              <div className="admin-crumb">
                <a href="#" onClick={e => { e.preventDefault(); setSection(parent.id) }}>← {parent.label}</a>
                <span> / {current?.label}</span>
              </div>
            )
          })()}
          {section === "dash"          && <Dashboard setSection={setSection}/>}
          {section === "gym"           && canAccess("gym")           && <AdminGymSection/>}
          {section === "vacances"      && canAccess("gym")           && <AdminVacancesSection/>}
          {section === "sejours"       && canAccess("sejours")       && <AdminSejoursSection/>}
          {section === "actu"          && canAccess("actu")          && <AdminActuSection/>}
          {section === "links"         && canAccess("links")         && <AdminLinksSection/>}
          {section === "site-texts"    && canAccess("site-texts")    && <AdminSiteTextsSection/>}
          {section === "members-password" && canAccess("members-password") && <AdminMembersPasswordSection/>}
          {section === "galerie"       && canAccess("galerie")       && <AdminGalerieSection/>}
          {section === "home"          && canAccess("home")          && <AdminHomeSection/>}
          {section === "gym-page"      && canAccess("gym-page")      && <AdminGymPageSection/>}
          {section === "rando-page"    && canAccess("rando-page")    && <AdminRandoPageSection/>}
          {section === "planning-rando-page" && canAccess("planning-rando-page") && <AdminPlanningRandoPageSection onOpenLinks={() => setSection("links")}/>}
          {section === "sante-page"    && canAccess("sante-page")    && <AdminSantePageSection/>}
          {section === "asso-page"     && canAccess("asso-page")     && <AdminAssoPageSection/>}
          {section === "comite"        && canAccess("comite")        && <AdminComiteSection/>}
          {section === "ag"            && canAccess("ag")            && <AdminAGSection/>}
          {section === "tarifs"        && canAccess("tarifs")        && <AdminTarifsSection/>}
          {section === "banner"        && <AdminBannerSection/>}
          {section === "guide"         && <AdminGuideSection/>}
          {section === "settings"      && <AdminSettings user={user}/>}
          {section === "access"        && isSuperAdmin               && <AdminAccessSection/>}
          {section === "backup"        && isSuperAdmin               && <AdminBackupSection/>}
        </div>
      </div>
    </>
  )
}
