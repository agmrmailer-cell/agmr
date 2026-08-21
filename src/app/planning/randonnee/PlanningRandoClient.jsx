'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import ExternalLinksPanel from '@/components/links/ExternalLinksPanel'
import { labelType } from '@/utils/format'

const TYPES = ["all","rando-jeudi","rando-dimanche","nordique-mardi","nordique-samedi","sortie-journee","sejour"]
const DOW = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"]
const MSHORT = ["jan","fév","mars","avr","mai","juin","juil","août","sept","oct","nov","déc"]
const INTERNAL_RANDO_PLANNING_ENABLED = false

export default function PlanningRandoClient({ sorties, links = [] }) {
  if (!INTERNAL_RANDO_PLANNING_ENABLED) {
    return (
      <section className="section">
        <div className="container">
          <ExternalLinksPanel
            links={links}
            title="Plannings complets en ligne"
            intro="Calendriers, documents et ressources externes pour la saison en cours."
          />
        </div>
      </section>
    )
  }

  return <InternalRandoPlanning sorties={sorties} links={links}/>
}

function InternalRandoPlanning({ sorties, links }) {
  const [filter, setFilter] = useState("all")

  const filtered = sorties
    .filter(s => filter === "all" || s.type === filter)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {TYPES.map(t => (
            <button key={t} className={`chip ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>
              {t === "all" ? "Toutes les sorties" : labelType(t)}
            </button>
          ))}
        </div>

        <div className="rando-list">
          {filtered.map(s => {
            const d = new Date(s.date)
            return (
              <div key={s.id} className="rando-card" style={{ opacity: s.annule ? 0.6 : 1 }}>
                <div className="rando-date-col">
                  <div className="rando-dow">{DOW[d.getDay()]}</div>
                  <div className="rando-day">{d.getDate()}</div>
                  <div className="rando-month">{MSHORT[d.getMonth()]}</div>
                </div>
                <div className="rando-info">
                  <div className="rando-title">{s.titre}</div>
                  <div className="rando-meta">
                    <span><Icon name="clock" size={13}/> Départ {s.heureDepart}</span>
                    <span><Icon name="pin" size={13}/> {s.pointDepart}</span>
                    {s.distanceKm && <span>{s.distanceKm} km{s.denivele ? ` · ${s.denivele}m D+` : ""}</span>}
                    {s.animateur && <span>{s.animateur}</span>}
                  </div>
                  <div className="rando-tags">
                    {s.groupes.map(g => <span key={g} className="rando-tag-groupe">{g}</span>)}
                    <span className={`rando-type type-${s.type}`}>{labelType(s.type)}</span>
                  </div>
                </div>
                <div className="rando-status">
                  {s.complet && <span className="badge badge-full">Complet</span>}
                  {s.annule && <span className="badge badge-cancel">Annulée</span>}
                  {!s.complet && !s.annule && <span className="badge badge-ok">Ouverte</span>}
                </div>
              </div>
            )
          })}
        </div>

        <ExternalLinksPanel
          links={links}
          title="Plannings complets en ligne"
          intro="Calendriers, documents et ressources externes pour la saison en cours."
        />
      </div>
    </section>
  )
}
