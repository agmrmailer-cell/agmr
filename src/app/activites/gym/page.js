export const dynamic = 'force-dynamic'
import Link from 'next/link'
import GenericBlockRenderer from '@/components/blocks/GenericBlockRenderer'
import Header from '@/components/shell/Header'
import Footer from '@/components/shell/Footer'
import { getGymPageBlocks, getGymDisciplines, getGymAnimateurs } from '@/lib/queries'

export const metadata = { title: 'La Gym — AGMR' }

const DEFAULT_DISCIPLINES = [
  { id: 'd1', mark: "G", nom: "Gym", description: "Gym générale, cardio, coordination." },
  { id: 'd2', mark: "B", nom: "Barre au sol", description: "Inspirée de la danse classique, travail de souplesse et de tonicité." },
  { id: 'd3', mark: "F", nom: "Fitball", description: "Équilibre et gainage avec un ballon." },
  { id: 'd4', mark: "G", nom: "Gym équilibre senior", description: "Prévention des chutes, coordination, mobilité articulaire." },
  { id: 'd5', mark: "G", nom: "Gym senior", description: "Maintien de la forme adapté aux seniors." },
  { id: 'd6', mark: "G", nom: "Gym tendance", description: "Cours dynamiques reflétant les nouvelles tendances." },
  { id: 'd7', mark: "P", nom: "Pilates", description: "Renforcement musculaire profond, posture, respiration." },
  { id: 'd8', mark: "P", nom: "Poundfit", description: "Fitness rythmé avec des baguettes légères." },
  { id: 'd9', mark: "S", nom: "Stretching", description: "Étirements, souplesse, récupération." },
  { id: 'd10', mark: "Y", nom: "Yoga & Qi Gong", description: "Postures, respiration, relaxation, méditation active." },
]

export default async function GymPage() {
  const [blocks, disciplines, animateurs] = await Promise.all([
    getGymPageBlocks(),
    getGymDisciplines(),
    getGymAnimateurs(),
  ])

  const bm = Object.fromEntries(blocks.map(b => [b.block_key, b]))
  const vis = (key) => bm[key]?.visible !== false

  const sortedBlocks = blocks
  const discList = disciplines.length > 0 ? disciplines : DEFAULT_DISCIPLINES
  const animList = animateurs

  return (
    <div className="page-shell">
      <Header/>
      <main className="page-main">

        {/* PAGE HEADER — rendered outside the main section if header block is first/visible */}
        {sortedBlocks.map(block => {
          if (!block.visible) return null
          if (block.block_key !== 'header') return null
          const content = block.content ?? {}
          return (
            <div key="header" className="page-header">
              <div className="container">
                <div className="crumb">
                  <Link href="/">Accueil</Link>
                  <span>/</span>
                  <span>Activités</span>
                  <span>/</span>
                  <span>Gym</span>
                </div>
                <div className="page-header-eyebrow">
                  {content.eyebrow ?? 'Activités · FFEPGV · Label Qualité Club Sport Santé'}
                </div>
                <h1>{content.titre ?? 'La Gym'}</h1>
                <p className="page-header-lede">
                  {content.lede ?? '43 heures de cours par semaine, 8 animateurs brevetés professionnels, 5 salles municipales. Construisez votre propre programme.'}
                </p>
              </div>
            </div>
          )
        })}

        <section className="section">
          <div className="container">
            <div className="two-col">

              {/* SIDE NAV */}
              <aside className="col-side">
                <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 16, fontWeight: 600 }}>
                  Sur cette page
                </div>
                <ul className="side-nav">
                  {vis('intro') && <li><a href="#intro" className="active">Introduction</a></li>}
                  <li><a href="#disciplines">Les disciplines</a></li>
                  {vis('programme') && <li><a href="#programme">Construire son programme</a></li>}
                  {animList.length > 0 && <li><a href="#animateurs">Animateurs</a></li>}
                  {vis('prescri') && <li><a href="#prescri">Prescri'Forme</a></li>}
                </ul>
              </aside>

              {/* MAIN CONTENT — iterated in ordre */}
              <div>

                {/* Disciplines always shown (not a block) */}
                {sortedBlocks.map(block => {
                  if (!block.visible) return null
                  const content = block.content ?? {}

                  switch (block.block_key) {
                    case 'header':
                      return null // rendered above

                    case 'intro':
                      return (
                        <div key="intro">
                          <h2 id="intro" style={{ fontSize: "2.2rem", marginBottom: 18 }}>
                            {content.titre ?? 'La Gymnastique Volontaire à Rambouillet'}
                          </h2>
                          <p style={{ fontSize: "1.12rem", color: "var(--ink-soft)" }}>
                            {content.texte1 ?? "Notre section est affiliée à la Fédération Française d'Éducation Physique et de Gymnastique Volontaire (FFEPGV). Elle bénéficie du label Qualité Club Sport Santé."}
                          </p>
                          <p>
                            {content.texte2 ?? "Tous les cours sont donnés par des animateurs brevetés d'État. Ils proposent 43 heures de cours par semaine, d'une grande variété, répartis dans 5 salles mises à disposition par la municipalité."}
                          </p>
                        </div>
                      )

                    case 'programme': {
                      const progItems = Array.isArray(content.items) ? content.items : [
                        '3 cours de gym',
                        '+ 2 cours de yoga / Qi Gong',
                        '+ 2 cours de Pilates',
                      ]
                      return (
                        <div key="programme" style={{ marginTop: 40, padding: 28, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
                          <h3 id="programme" style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: 10 }}>
                            {content.titre ?? 'Construisez votre propre programme'}
                          </h3>
                          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
                            {content.texte_intro ?? "Vous pouvez assister à 2 ou 3 heures de cours par semaine. L'adhésion vous permet de choisir, parmi les 43 cours proposés, au maximum :"}
                          </p>
                          <ul style={{ margin: "12px 0 0 20px", color: "var(--ink-soft)" }}>
                            {progItems.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                          {(content.note || !content.titre) && (
                            <p style={{ marginTop: 14, fontSize: "0.92rem", color: "var(--ink-mute)" }}>
                              {content.note ?? 'Chaque cours couvre la saison complète, soit environ 34 séances.'}
                            </p>
                          )}
                          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                            <Link className="btn btn-primary" href={content.cta1_lien ?? '/planning/gym'}>
                              {content.cta1_texte ?? 'Voir le planning'}
                            </Link>
                            <Link className="btn btn-ghost" href={content.cta2_lien ?? '/inscriptions'}>
                              {content.cta2_texte ?? "S'inscrire"}
                            </Link>
                          </div>
                        </div>
                      )
                    }

                    case 'prescri':
                      return (
                        <div key="prescri" style={{ marginTop: 48, padding: 32, background: "var(--green-tint)", borderRadius: "var(--r-md)" }}>
                          <h3 id="prescri" style={{ marginBottom: 10 }}>
                            {content.titre ?? "Prescri'Forme — sport sur ordonnance"}
                          </h3>
                          <p style={{ color: "var(--ink-soft)", marginBottom: 14 }}>
                            {content.texte ?? "L'Association est agréée pour dispenser des cours de gym volontaire sur prescription médicale (dispositif Prescri'Forme, Île-de-France, depuis septembre 2019)."}
                          </p>
                          <Link className="btn btn-ghost btn-sm" href={content.cta_lien ?? '/activites/sante'}>
                            {content.cta_texte ?? 'En savoir plus'}
                          </Link>
                        </div>
                      )

                    default:
                      return <GenericBlockRenderer key={block.block_key} block={block} />
                  }
                })}

                {/* Disciplines section — always shown, not a block */}
                <div style={{ marginTop: 48 }}>
                  <h3 id="disciplines" style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", fontWeight: 500 }}>
                    Les disciplines
                  </h3>
                  <p className="muted">
                    {discList.length} discipline{discList.length > 1 ? 's' : ''} pour construire votre programme sur mesure.
                  </p>
                  <div className="disc-list">
                    {discList.map(d => (
                      <div key={d.id} className="disc-item">
                        <div className="disc-item-mark">{d.mark}</div>
                        <div className="disc-item-text">
                          <div className="disc-item-name">{d.nom}</div>
                          <div className="disc-item-desc">{d.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Animateurs — always shown if data exists, not a block */}
                {animList.length > 0 && (
                  <div style={{ marginTop: 60 }}>
                    <h3 id="animateurs" style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", fontWeight: 500 }}>
                      Notre équipe d'animateurs
                    </h3>
                    <p className="muted">
                      {animList.length} animateur{animList.length > 1 ? 's' : ''} diplômé{animList.length > 1 ? 's' : ''} d'État.
                    </p>
                    <div className="team-grid">
                      {animList.map(a => (
                        <div className="team-card" key={a.id}>
                          <div
                            className="team-photo"
                            style={a.photo_url ? { backgroundImage: `url(${a.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                          >
                            {!a.photo_url && (
                              <div className="team-photo-initial">
                                {a.nom?.charAt(0)?.toUpperCase() ?? '?'}
                              </div>
                            )}
                          </div>
                          <div className="team-body">
                            <div className="team-name">{a.nom}</div>
                            <div className="team-role">{a.role}</div>
                            {a.disciplines && <div className="team-disc">{a.disciplines}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer/>
    </div>
  )
}
