'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AGMRLogo from '@/components/ui/AGMRLogo'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import FontSizeWidget from '@/components/ui/FontSizeWidget'

function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m }

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [navMeta, setNavMeta] = useState({
    gym:     '…',
    rando:   '…',
  })

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('gym_courses').select('discipline, heure_debut, heure_fin').eq('actif', true),
      sb.from('rando_sorties').select('groupes, type')
        .gte('date', new Date().toISOString().slice(0, 10))
        .eq('annule', false),
    ]).then(([gym, rando]) => {
      // Gym : disciplines uniques + total heures par semaine
      const courses     = gym.data ?? []
      const disciplines = new Set(courses.map(c => c.discipline)).size
      const totalMin    = courses.reduce((sum, c) => {
        const d = toMin(c.heure_fin) - toMin(c.heure_debut)
        return sum + (d > 0 ? d : 0)
      }, 0)
      const heures = Math.round(totalMin / 60)

      // Rando : nombre de sorties à venir
      const sorties = rando.data ?? []
      const nbSorties = sorties.length

      setNavMeta({
        gym:   `${disciplines} discipline${disciplines > 1 ? 's' : ''} · ${heures}h/semaine`,
        rando: nbSorties > 0
          ? `${nbSorties} sortie${nbSorties > 1 ? 's' : ''} à venir`
          : 'Jeudi et dimanche',
      })
    }).catch(() => {
      setNavMeta({ gym: '10 disciplines · 43h/semaine', rando: 'Jeudi et dimanche' })
    })
  }, [])

  const items = [
    { id: "home", label: "Accueil", href: "/" },
    { id: "activites", label: "Activités", group: ["/activites"], drop: [
      { href: "/activites/gym",       label: "Gymnastique",        meta: navMeta.gym   },
      { href: "/activites/randonnee", label: "Randonnée & Marche nordique", meta: navMeta.rando },
      { href: "/activites/sante",     label: "Santé par le sport", meta: "Prescri'Forme · Rando-Santé" },
    ]},
    { id: "planning", label: "Planning", group: ["/planning"], drop: [
      { href: "/planning/gym", label: "Planning Gym", meta: "Grille hebdomadaire" },
      { href: "/planning/randonnee", label: "Planning Rando & Nordique", meta: "Sorties à venir" },
    ]},
    { id: "actu", label: "Actualités", group: ["/actualites"], drop: [
      { href: "/actualites", label: "Annonces & infos", meta: "Toutes les actus" },
      { href: "/actualites/sejours", label: "Séjours & sorties", meta: "Programme saison" },
      { href: "/actualites/galerie", label: "Galerie photos", meta: "Souvenirs en images" },
    ]},
    { id: "asso", label: "L'association", group: ["/association"], drop: [
      { href: "/association", label: "Présentation", meta: "Histoire & gouvernance" },
      { href: "/association/comite-directeur", label: "Comité directeur", meta: "Bureau & animateurs" },
      { href: "/association/assemblee-generale", label: "Assemblée générale", meta: "Documents officiels" },
    ]},
    { id: "contact", label: "Contact", href: "/contact" },
  ]

  const isActive = (item) => {
    if (item.href) return pathname === item.href
    if (item.group) return item.group.some(g => pathname.startsWith(g))
    return false
  }

  useEffect(() => {
    setMenuOpen(false)
    setExpanded(null)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
    <header className="header">
      <div className="header-inner">
        <Link className="logo-link" href="/">
          <AGMRLogo size={52}/>
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          {items.map(it => it.drop ? (
            <div key={it.id} className="nav-item-drop">
              <button className={`nav-item ${isActive(it) ? "active" : ""}`}>
                {it.label} <Icon name="chevronDown" size={12}/>
              </button>
              <div className="nav-drop" role="menu">
                {it.drop.map(d => (
                  <Link key={d.href} href={d.href}>
                    <strong>{d.label}</strong>
                    <span className="nav-drop-meta">{d.meta}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={it.id} className={`nav-item ${isActive(it) ? "active" : ""}`} href={it.href}>
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="btn btn-primary btn-sm" href="/inscriptions">
            S&apos;inscrire
          </Link>
        </div>
        <button
          className="burger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <Icon name={menuOpen ? 'x' : 'menu'} size={22}/>
        </button>
      </div>

      {menuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? 'open' : ''}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <div className="mobile-menu-head">
          <Link className="logo-link" href="/" onClick={() => setMenuOpen(false)}>
            <AGMRLogo size={40}/>
          </Link>
          <button
            className="mobile-menu-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <Icon name="x" size={20}/>
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Navigation mobile">
          {items.map(it => it.drop ? (
            <div key={it.id} className="mobile-nav-section">
              <button
                className={`mobile-nav-item ${isActive(it) ? 'active' : ''}`}
                onClick={() => setExpanded(expanded === it.id ? null : it.id)}
                aria-expanded={expanded === it.id}
              >
                {it.label}
                <span className={`mobile-nav-chevron ${expanded === it.id ? 'open' : ''}`}>
                  <Icon name="chevronDown" size={14}/>
                </span>
              </button>
              {expanded === it.id && (
                <div className="mobile-nav-drop">
                  {it.drop.map(d => (
                    <Link
                      key={d.href}
                      href={d.href}
                      className="mobile-nav-subitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <strong>{d.label}</strong>
                      <span className="mobile-nav-meta">{d.meta}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={it.id}
              className={`mobile-nav-item ${isActive(it) ? 'active' : ''}`}
              href={it.href}
              onClick={() => setMenuOpen(false)}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="mobile-menu-actions">
          <Link className="btn btn-primary" href="/inscriptions" onClick={() => setMenuOpen(false)}>
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </header>
    <FontSizeWidget/>
    </>
  )
}
