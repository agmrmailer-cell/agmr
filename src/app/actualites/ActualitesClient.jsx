'use client'
import { useState } from 'react'
import ExternalLinksPanel from '@/components/links/ExternalLinksPanel'
import { formatDateFR, catLabel } from '@/utils/format'

const CATS = ["all","gym","rando","nordique","asso","event"]

export default function ActualitesClient({ articles, links = [] }) {
  const [filter, setFilter] = useState("all")
  const filtered = articles.filter(n => filter === "all" || n.cat === filter)

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c} className={`chip ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>
              {c === "all" ? "Tout" : catLabel(c)}
            </button>
          ))}
        </div>
        <div className="news-grid">
          {filtered.map(n => (
            <article key={n.id} style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-md)", padding: 28 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, fontSize: "0.82rem", color: "var(--ink-mute)" }}>
                <span className={`news-cat news-cat-${n.cat}`}>{catLabel(n.cat)}</span>
                <span>{formatDateFR(n.date)}</span>
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 10 }}>{n.title}</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", margin: 0 }}>{n.excerpt}</p>
            </article>
          ))}
        </div>
        <ExternalLinksPanel
          links={links}
          title="Evenements et ressources externes"
          intro="Liens utiles associes aux annonces en cours."
        />
      </div>
    </section>
  )
}
