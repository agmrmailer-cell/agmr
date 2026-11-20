'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useHelp } from '@/lib/help-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AGMRLogo from '@/components/ui/AGMRLogo'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
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
import { sectionFromSlug, sectionUrl } from './admin-url'
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
        { id: 'menu',       label: 'Menu du site',                icon: 'settings',      desc: 'Intitulés du menu et des sous-menus, boutons Adhérents / S\'inscrire', perm: 'site-texts' },
      ] },
    { id: 'hub:plannings', label: 'Plannings', icon: 'calendar',
      desc: 'Horaires des cours de gym et plannings des sorties de marche.',
      children: [
        { id: 'gym',                 label: 'Cours de gym',       icon: 'calendar', desc: 'Jours, horaires, salles, animateurs' },
        { id: 'vacances',            label: 'Vacances scolaires', icon: 'calendar', desc: 'Périodes sans cours de gym', perm: 'gym' },
        { id: 'planning-rando-page', label: 'Planning rando',     icon: 'mountain', desc: 'Liens vers les plannings (réservés aux adhérents)' },
      ] },
    { id: 'hub:actualites', label: 'Actualités', icon: 'file',
      desc: 'Annonces, séjours et message défilant en haut du site.',
      children: [
        { id: 'actu',    label: 'Annonces',          icon: 'file', desc: 'Actualités affichées sur le site' },
        { id: 'sejours', label: 'Séjours & sorties', icon: 'pin',  desc: 'Séjours, dates, statut, photo' },
        { id: 'banner',  label: "Bandeau d'info",    icon: 'info', desc: 'Message défilant en haut de toutes les pages', always: true },
      ] },
    { id: 'galerie', label: 'Photos', icon: 'image' },
    { id: 'links', label: 'Liens & documents', icon: 'file' },
    { id: 'hub:association', label: 'Association', icon: 'user',
      desc: "Équipe dirigeante, documents d'assemblée générale et tarifs.",
      children: [
        { id: 'comite', label: 'Comité directeur',   icon: 'user', desc: 'Membres du bureau et photos' },
        { id: 'ag',     label: 'Assemblée générale', icon: 'file', desc: 'Comptes rendus et documents' },
        { id: 'tarifs', label: 'Tarifs',             icon: 'file', desc: 'Cotisations et licences' },
      ] },
    { id: 'hub:reglages', label: 'Réglages & aide', icon: 'settings', bottom: true,
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.from('site_banners').select('id').eq('active', true).limit(1)
      .then(({ data }) => setBannerActive((data ?? []).length > 0))
  }, [section, supabase]) // re-check quand on change de section

  const items = visibleNav(isSuperAdmin, canAccess)
  const mainItems = items.filter(it => !it.bottom)
  const bottomItems = items.filter(it => it.bottom)

  const open = it => {
    setMobileOpen(false)
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
      {(it.id === 'hub:actualites') && bannerActive && (
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
    <aside className={`admin-side${mobileOpen ? ' is-open' : ''}`}>
      <div className="admin-side-brand">
        <AGMRLogo size={52} light={true} withTagline={false}/>
        <div className="asb-2">Back-office</div>
        <button type="button" className="admin-mobile-toggle" aria-expanded={mobileOpen} onClick={() => setMobileOpen(o => !o)}>
          <Icon name={mobileOpen ? 'x' : 'menu'} size={18}/> {mobileOpen ? 'Fermer' : 'Menu'}
        </button>
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
// Saison en cours (septembre → août), ex. « 2025-2026 »
function currentSeason(d = new Date()) {
  const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
}

const isMissingTable = err => !!err && /does not exist|could not find the table|schema cache|42P01|PGRST205/i.test(`${err.message} ${err.code}`)

// Liste « À vérifier » : seulement ce qui demande une action, filtré selon les droits de l'administrateur
async function loadChecks(supabase, canAccess, isSuperAdmin) {
  const today = new Date().toISOString().slice(0, 10)
  const now = Date.now()
  const checks = []
  const [texts, settings, banners, links, actus, vacances, tarifs, sejours] = await Promise.all([
    supabase.from('site_texts').select('key').limit(1),
    supabase.from('site_settings').select('key, value').eq('key', 'members_password'),
    supabase.from('site_banners').select('id, message, active, expires_at'),
    supabase.from('external_links').select('id, title, zones, active, ends_at'),
    supabase.from('actualites').select('date').order('date', { ascending: false }).limit(1),
    supabase.from('vacances_scolaires').select('date_fin').gte('date_fin', today).limit(1),
    supabase.from('tarifs').select('label, note').eq('label', '__page_config__').maybeSingle(),
    supabase.from('sejours').select('statut'),
  ])

  const results = [texts, settings, banners, links, actus, vacances, tarifs, sejours]
  if (results.every(r => r.error)) {
    return [{ level: 'urgent', text: 'Vérification impossible : la base de données ne répond pas. Vérifiez votre connexion internet puis rechargez la page.' }]
  }

  if (isSuperAdmin && (isMissingTable(texts.error) || isMissingTable(settings.error))) {
    checks.push({ level: 'urgent', text: "La mise à jour de la base n'a pas été faite : certains textes et le mot de passe adhérents ne peuvent pas être enregistrés.", hint: 'Exécuter le fichier supabase/mise_a_jour_novembre_2026.sql dans Supabase (SQL Editor → Run).' })
  }
  if (canAccess('members-password') && !settings.error && !(settings.data?.[0]?.value)) {
    checks.push({ level: 'warning', text: "Le mot de passe adhérents n'est pas défini dans l'administration.", action: ['members-password', 'Définir le mot de passe'] })
  }

  const activeBanners = (banners.data ?? []).filter(b => b.active)
  const expired = activeBanners.filter(b => b.expires_at && new Date(b.expires_at).getTime() < now)
  if (expired.length) checks.push({ level: 'info', text: `${expired.length} bandeau${expired.length > 1 ? 'x' : ''} d'info expiré${expired.length > 1 ? 's' : ''} (plus affiché) peut être désactivé ou supprimé.`, action: ['banner', 'Voir le bandeau'] })
  const shown = activeBanners.filter(b => !b.expires_at || new Date(b.expires_at).getTime() >= now)
  if (shown.length) checks.push({ level: 'info', text: `Bandeau affiché en ce moment : « ${shown[0].message.slice(0, 80)}${shown[0].message.length > 80 ? '…' : ''} »`, action: ['banner', 'Modifier'] })

  if (canAccess('links') || canAccess('planning-rando-page')) {
    const all = links.data ?? []
    const planning = all.filter(l => l.active && l.zones?.includes('planning-rando'))
    if (!links.error && planning.length === 0) checks.push({ level: 'warning', text: 'Aucun planning rando n’est publié : la page Planning Rando est vide pour les adhérents.', action: ['planning-rando-page', 'Ajouter un planning'] })
    const outdated = all.filter(l => l.active && l.ends_at && new Date(l.ends_at).getTime() < now)
    if (outdated.length) checks.push({ level: 'info', text: `${outdated.length} lien${outdated.length > 1 ? 's ont' : ' a'} dépassé sa date de fin d'affichage (plus visible sur le site).`, action: ['links', 'Faire le tri'] })
  }

  if (canAccess('actu') && !actus.error) {
    const last = actus.data?.[0]?.date
    const days = last ? Math.floor((now - new Date(last).getTime()) / 86400000) : null
    if (days === null) checks.push({ level: 'info', text: 'Aucune actualité publiée.', action: ['actu', 'Publier une annonce'] })
    else if (days > 45) checks.push({ level: 'info', text: `Dernière actualité il y a ${days} jours.`, action: ['actu', 'Publier une annonce'] })
  }

  if (canAccess('gym') && !vacances.error && (vacances.data ?? []).length === 0) {
    checks.push({ level: 'warning', text: "Aucune période de vacances scolaires à venir n'est renseignée (le planning gym ne les signalera pas).", action: ['vacances', 'Ajouter les vacances'] })
  }

  if (canAccess('tarifs') && !tarifs.error) {
    let saison = null
    try { saison = JSON.parse(tarifs.data?.note ?? '{}').saison ?? null } catch {}
    if (saison && saison !== currentSeason()) checks.push({ level: 'warning', text: `La page Tarifs affiche encore la saison ${saison}.`, action: ['tarifs', 'Mettre à jour'] })
  }

  if (canAccess('sejours') && !sejours.error) {
    const open = (sejours.data ?? []).filter(x => x.statut === 'ouvert').length
    if (open) checks.push({ level: 'info', text: `${open} séjour${open > 1 ? 's' : ''} ouvert${open > 1 ? 's' : ''} aux inscriptions : pensez à les passer en « Complet » ou « Terminé » le moment venu.`, action: ['sejours', 'Voir les séjours'] })
  }

  return checks
}

const CHECK_STYLE = {
  urgent:  { bg: '#fbe9e4', border: '#e4a08b', dot: '#a3341b', label: 'Urgent' },
  warning: { bg: '#fdf4e3', border: '#ecd29c', dot: '#c48a1a', label: 'À faire' },
  info:    { bg: 'var(--bg-elev)', border: 'var(--line)', dot: '#6b7d6e', label: 'Info' },
}

function Dashboard({ setSection, canAccess, isSuperAdmin, user, displayName }) {
  const [checks, setChecks]     = useState(null)
  const [activity, setActivity] = useState(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    loadChecks(supabase, canAccess, isSuperAdmin).then(setChecks).catch(() => setChecks([]))
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => setActivity(data ?? []))
    // canAccess dépend uniquement du profil chargé une fois
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const shortcuts = [
    ['actu', 'Publier une annonce', 'file'],
    ['planning-rando-page', 'Ajouter un planning rando', 'mountain'],
    ['banner', "Changer le bandeau d'info", 'info'],
    ['galerie', 'Ajouter des photos', 'image'],
    ['gym', 'Modifier un cours de gym', 'calendar'],
  ].filter(([id]) => id === 'banner' || canAccess(id))

  const firstName = (displayName || user?.email || '').split(/[@ .]/)[0]

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Bonjour{firstName ? ` ${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}` : ''}</h1>
          <p className="muted" style={{ margin: 0 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · saison {currentSeason()}</p>
        </div>
        <button className="btn btn-primary" onClick={() => openVisualEditor('/')}>
          <Icon name="edit" size={15}/> Modifier le site
        </button>
      </div>

      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>À vérifier</h3>
            {checks === null && <div className="muted">Vérification en cours…</div>}
            {checks?.length === 0 && <div style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Tout est à jour, rien à signaler.</div>}
            <div style={{ display: 'grid', gap: 10 }}>
              {(checks ?? []).map((c, i) => {
                const st = CHECK_STYLE[c.level]
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', background: st.bg, border: `1px solid ${st.border}`, borderRadius: 'var(--r-sm)' }}>
                    <span title={st.label} style={{ width: 9, height: 9, borderRadius: '50%', background: st.dot, marginTop: 6, flexShrink: 0 }}/>
                    <div style={{ flex: 1, fontSize: '0.93rem', lineHeight: 1.45 }}>
                      {c.text}
                      {c.hint && <div className="muted" style={{ fontSize: '0.84rem', marginTop: 4 }}>{c.hint}</div>}
                    </div>
                    {c.action && (
                      <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => setSection(c.action[0])}>{c.action[1]} →</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--sans)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Dernières modifications</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.94rem' }}>
              {activity === null && <li className="muted" style={{ padding: '10px 0' }}>Chargement…</li>}
              {activity !== null && activity.length === 0 && <li className="muted" style={{ padding: '10px 0' }}>Aucune modification pour l&apos;instant.</li>}
              {(activity ?? []).map(a => (
                <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <span>
                    {a.message}
                    {a.user_email && <span className="muted" style={{ fontSize: '0.82rem' }}> · {a.user_email.split('@')[0]}</span>}
                  </span>
                  <span className="muted" style={{ fontSize: '0.84rem', whiteSpace: 'nowrap' }}>{relativeTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--sans)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Raccourcis</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => openVisualEditor('/')}>
              <Icon name="edit" size={14}/> Modifier un texte ou une photo du site
            </button>
            {shortcuts.map(([id, label, icon]) => (
              <button key={id} className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => setSection(id)}>
                <Icon name={icon} size={14}/> {label}
              </button>
            ))}
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => setSection('guide')}>
              <Icon name="info" size={14}/> Comment ça marche ?
            </button>
          </div>
        </div>
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
.admin-mobile-toggle { display: none; }
.db-error-toast {
  position: fixed; right: 20px; bottom: 20px; z-index: 1000; max-width: min(460px, calc(100vw - 32px));
  display: grid; grid-template-columns: 1fr auto; gap: 4px 14px; padding: 14px 16px;
  background: #a3341b; color: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.25); font-size: 0.9rem; line-height: 1.45;
}
.db-error-toast strong { grid-column: 1; }
.db-error-toast span { grid-column: 1; opacity: .95; }
.db-error-toast button { grid-column: 2; grid-row: 1 / span 2; align-self: start; background: none; border: 0; color: #fff; font-size: 1.4rem; line-height: 1; cursor: pointer; }
.admin-main { min-width: 0; }

/* ── Téléphone et petite tablette ── */
@media (max-width: 900px) {
  .admin-shell { grid-template-columns: 1fr; }
  .admin-side { position: sticky; top: 0; z-index: 150; height: auto; max-height: 100vh; padding: 0; }
  .admin-side-brand { flex-direction: row; justify-content: space-between; padding: 10px 16px; margin-bottom: 0; gap: 10px; }
  .admin-side-brand .asb-2 { display: none; }
  .admin-side-brand svg { width: 40px; height: auto; }
  .admin-mobile-toggle {
    display: inline-flex; align-items: center; gap: 8px; margin-left: auto;
    padding: 8px 14px; border-radius: 8px; border: 1px solid #2a3a2d; background: rgba(255,255,255,0.06);
    color: #fff; font: inherit; font-size: 0.92rem; cursor: pointer;
  }
  .admin-side nav, .admin-side-foot { display: none; }
  .admin-side.is-open nav { display: flex; padding-bottom: 8px; }
  .admin-side.is-open .admin-side-foot { display: block; }
  .admin-side nav a { padding: 13px 20px; font-size: 1rem; }
  .admin-main { padding: 20px 16px 40px; }
  .admin-head { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; }
  .admin-head > div:last-child { flex-wrap: wrap; }
  .admin-head h1 { font-size: 1.7rem; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .row-2, .row-3 { grid-template-columns: 1fr; }
  .tbl { display: block; overflow-x: auto; white-space: nowrap; }
  .modal-back { padding: 0; place-items: stretch; }
  .modal { max-width: none !important; max-height: 100vh; height: 100%; border-radius: 0; }
  .modal-head, .modal-body { padding-left: 16px; padding-right: 16px; }
  .hub-grid { grid-template-columns: 1fr; }
  .hub-card-actions { padding-left: 22px; }
  .site-texts-layout { grid-template-columns: 1fr !important; }
  .site-texts-layout > nav { position: static !important; flex-direction: row !important; flex-wrap: wrap; }
  .dash-grid { grid-template-columns: 1fr !important; }
}
`

// ── Message d'erreur global (enregistrement refusé, réseau…) ───
function DbErrorToast() {
  const [message, setMessage] = useState(null)
  useEffect(() => {
    let timer
    const onError = e => {
      setMessage(e.detail?.message ?? "L'enregistrement n'a pas pu aboutir.")
      clearTimeout(timer)
      timer = setTimeout(() => setMessage(null), 9000)
    }
    window.addEventListener('agmr-db-error', onError)
    return () => { window.removeEventListener('agmr-db-error', onError); clearTimeout(timer) }
  }, [])
  if (!message) return null
  return (
    <div className="db-error-toast" role="alert">
      <strong>Enregistrement non effectué</strong>
      <span>{message}</span>
      <button type="button" aria-label="Fermer" onClick={() => setMessage(null)}>×</button>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────
export default function AdminApp({ user, profile, initialSection = 'dash' }) {
  const [section, setSectionState] = useState(initialSection)

  // Change de section en mettant à jour l'adresse (bouton Retour, rechargement et liens directs fonctionnent)
  const setSection = useCallback(id => {
    setSectionState(id)
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== sectionUrl(id)) {
      window.history.pushState({ section: id }, '', sectionUrl(id))
    }
    window.scrollTo?.(0, 0)
  }, [])

  useEffect(() => {
    const onPop = () => setSectionState(sectionFromSlug(new URLSearchParams(window.location.search).get('section')))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const isSuperAdmin = profile?.role === 'super_admin'

  // Un super_admin a accès à tout. Un admin classique seulement à ses permissions.
  const canAccess = (id) => isSuperAdmin || (profile?.permissions ?? []).includes(id)

  return (
    <>
      <style>{ADMIN_CSS}</style>
      <DbErrorToast/>
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
          {section === "dash"          && <Dashboard setSection={setSection} canAccess={canAccess} isSuperAdmin={isSuperAdmin} user={user} displayName={profile?.display_name}/>}
          {section === "gym"           && canAccess("gym")           && <AdminGymSection/>}
          {section === "vacances"      && canAccess("gym")           && <AdminVacancesSection/>}
          {section === "sejours"       && canAccess("sejours")       && <AdminSejoursSection/>}
          {section === "actu"          && canAccess("actu")          && <AdminActuSection/>}
          {section === "links"         && canAccess("links")         && <AdminLinksSection/>}
          {section === "site-texts"    && canAccess("site-texts")    && <AdminSiteTextsSection/>}
          {section === "menu"          && canAccess("site-texts")    && <AdminSiteTextsSection onlyPage="navigation"/>}
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
