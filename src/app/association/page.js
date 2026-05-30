export const dynamic = 'force-dynamic'
import Link from 'next/link'
import GenericBlockRenderer from '@/components/blocks/GenericBlockRenderer'
import Header from '@/components/shell/Header'
import Footer from '@/components/shell/Footer'
import Icon from '@/components/ui/Icon'
import { getBureau, getAssoPageBlocks } from '@/lib/queries'

export const metadata = { title: "L'Association — AGMR" }

const DEFAULT_AFFILIATIONS = [
  { eyebrow: 'FFEPGV',            titre: 'Qualité Club Sport Santé', desc: "Label fédéral attestant de la qualité de l'encadrement et du projet club." },
  { eyebrow: 'FFR',               titre: 'Label Rando-Santé',        desc: "Encadrement formé pour les pratiquants nécessitant une marche adaptée." },
  { eyebrow: "Prescri'Forme",     titre: 'Sport sur ordonnance',     desc: "Agrément depuis septembre 2019 pour les Activités Physiques Adaptées (ALD)." },
  { eyebrow: 'Conseil Général 78',titre: 'Partenaire',               desc: "Soutien institutionnel et financement de l'association." },
]

const DEFAULT_DOCS = [
  { titre: 'Règlement intérieur',              meta: 'Janvier 2024 · 240 ko', url: '#' },
  { titre: 'Statuts AGMR',                     meta: 'Octobre 2024 · 180 ko', url: '#' },
  { titre: "Contrat d'engagement républicain", meta: '2024 · 120 ko',         url: '#' },
]

export default async function AssoPage() {
  const [bureau, blocks] = await Promise.all([getBureau(), getAssoPageBlocks()])

  const bm  = Object.fromEntries(blocks.map(b => [b.block_key, b]))
  const vis = (key) => bm[key]?.visible !== false
  const sortedBlocks = blocks

  return (
    <div className="page-shell">
      <Header/>
      <main className="page-main">

        {sortedBlocks.map(block => {
          if (!block.visible || block.block_key !== 'header') return null
          const content = block.content ?? {}
          return (
            <div key="header" className="page-header">
              <div className="container">
                <div className="crumb">Accueil / L'association</div>
                <div className="page-header-eyebrow">{content.eyebrow ?? "L'association · Loi 1901 · Fondée en 1970"}</div>
                <h1>{content.titre ?? 'Une association, un esprit'}</h1>
                <p className="page-header-lede">{content.lede ?? "L'Association Gym Marche Rambouillet est le nouveau nom du Club Loisirs et Détente. Renommée en novembre 2018, elle compte aujourd'hui environ 750 adhérents."}</p>
              </div>
            </div>
          )
        })}

        <section className="section">
          <div className="container">
            <div className="two-col">
              <aside className="col-side">
                <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 16, fontWeight: 600 }}>Sur cette page</div>
                <ul className="side-nav">
                  {vis('histoire')       && <li><a href="#histoire" className="active">Notre histoire</a></li>}
                  {vis('sections')       && <li><a href="#sections">Les sections</a></li>}
                  {vis('gouvernance')    && <li><a href="#gouvernance">Gouvernance</a></li>}
                  {vis('affiliations')   && <li><a href="#affiliations">Affiliations</a></li>}
                  {vis('documents_asso') && <li><a href="#documents">Documents</a></li>}
                </ul>
              </aside>

              <div>
                {sortedBlocks.map(block => {
                  if (!block.visible) return null
                  const content = block.content ?? {}

                  switch (block.block_key) {
                    case 'header':
                      return null

                    case 'histoire':
                      return (
                        <div key="histoire">
                          <h2 id="histoire" style={{ fontSize: "1.8rem", marginBottom: 16 }}>
                            {content.titre ?? 'Notre histoire'}
                          </h2>
                          <p style={{ color: "var(--ink-soft)" }}>
                            {content.texte1 ?? "L'Association Gym Marche Rambouillet (AGMR) est le nouveau nom du Club Loisirs et Détente (CLD). C'est une association selon la loi de 1901, créée en 1970. Le changement de nom a été voté lors de l'assemblée générale extraordinaire de novembre 2018."}
                          </p>
                          <div style={{ margin: "20px 0", padding: "20px 24px", borderLeft: "3px solid var(--accent)", background: "var(--accent-tint)", borderRadius: "0 var(--r-sm) var(--r-sm) 0" }}>
                            <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.15rem", color: "var(--accent-deep)", margin: 0 }}>
                              « {content.citation ?? "Ces activités sont pratiquées dans un esprit de détente et de convivialité favorisant l'épanouissement de chacun, en dehors de toute notion de compétition."} »
                            </p>
                          </div>
                          {(content.texte2 || !content.titre) && (
                            <p style={{ color: "var(--ink-soft)" }}>
                              {content.texte2 ?? "Ouverte à tous les courants de pensées, l'association s'interdit toutes discussions confessionnelles ou politiques."}
                            </p>
                          )}
                        </div>
                      )

                    case 'sections':
                      return (
                        <div key="sections">
                          <h2 id="sections" style={{ fontSize: "1.8rem", marginTop: 48, marginBottom: 16 }}>
                            {content.titre ?? 'Les sections'}
                          </h2>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 8 }}>
                            <div style={{ padding: 22, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
                              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
                                {content.gym_label ?? 'Section Gym'}
                              </div>
                              <div style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", fontWeight: 500, marginBottom: 8 }}>
                                {content.gym_chiffre ?? '~460 pratiquants'}
                              </div>
                              <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink-soft)" }}>
                                {content.gym_texte ?? 'Affiliée à la FFEPGV. 41h de cours, 5 salles, 8 animatrices et animateurs diplômés.'}
                              </p>
                            </div>
                            <div style={{ padding: 22, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
                              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
                                {content.marche_label ?? 'Section Marche'}
                              </div>
                              <div style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", fontWeight: 500, marginBottom: 8 }}>
                                {content.marche_chiffre ?? '~290 pratiquants'}
                              </div>
                              <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink-soft)" }}>
                                {content.marche_texte ?? 'Affiliée à la FFR. Sorties jeudi, dimanche, marche nordique mardi/samedi, séjours. 25 animateurs bénévoles.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )

                    case 'gouvernance':
                      return (
                        <div key="gouvernance">
                          <h2 id="gouvernance" style={{ fontSize: "1.8rem", marginTop: 48, marginBottom: 8 }}>
                            {content.titre ?? 'Gouvernance'}
                          </h2>
                          <p style={{ color: "var(--ink-soft)", marginBottom: 20 }}>
                            {content.texte ?? "L'association est dirigée par un comité directeur élu en assemblée générale. Il se réunit 2 fois par trimestre."}
                          </p>
                          <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 12 }}>
                            Comité directeur 2025-2026
                          </h3>
                          <table className="tbl" style={{ marginBottom: 16 }}>
                            <thead><tr><th>Membre</th><th>Rôle</th></tr></thead>
                            <tbody>
                              {bureau.map(b => (
                                <tr key={b.id}><td><strong>{b.nom}</strong></td><td>{b.role}</td></tr>
                              ))}
                            </tbody>
                          </table>
                          <Link className="btn btn-ghost btn-sm" href="/association/comite-directeur">
                            Voir tous les animateurs →
                          </Link>
                        </div>
                      )

                    case 'affiliations': {
                      const affiliations = Array.isArray(content.cards) ? content.cards : DEFAULT_AFFILIATIONS
                      return (
                        <div key="affiliations">
                          <h2 id="affiliations" style={{ fontSize: "1.8rem", marginTop: 48, marginBottom: 16 }}>
                            {content.titre ?? 'Affiliations & labels'}
                          </h2>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {affiliations.map((a, i) => (
                              <div key={i} style={{ padding: 22, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 6 }}>{a.eyebrow}</div>
                                <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", fontWeight: 500, marginBottom: 8 }}>{a.titre}</div>
                                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-soft)" }}>{a.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }

                    case 'documents_asso': {
                      const docsAsso = Array.isArray(content.docs) ? content.docs : DEFAULT_DOCS
                      return (
                        <div key="documents_asso">
                          <h2 id="documents" style={{ fontSize: "1.8rem", marginTop: 48, marginBottom: 16 }}>
                            {content.titre ?? 'Documents officiels'}
                          </h2>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                            {docsAsso.map((d, i) => (
                              <a key={i} href={d.url ?? '#'} style={{ padding: "18px 20px", background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", textDecoration: "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div style={{ width: 32, height: 32, background: "var(--accent-tint)", borderRadius: "var(--r-sm)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                  <Icon name="file" size={14}/>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)", marginBottom: 2 }}>{d.titre}</div>
                                  <div style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>{d.meta}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    }

                    default:
                      return <GenericBlockRenderer key={block.block_key} block={block} />
                  }
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
