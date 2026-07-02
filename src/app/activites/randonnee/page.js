export const dynamic = 'force-dynamic'
import Link from 'next/link'
import GenericBlockRenderer from '@/components/blocks/GenericBlockRenderer'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import Icon from '@/components/ui/Icon'
import { getRandoPageBlocks, getRandoJeudiGroupes, getNordiquePageBlocks } from '@/lib/queries'

export const metadata = { title: 'Randonnée & Marche nordique — AGMR' }

const DEFAULT_NORDIQUE_STEPS = ['Échauffement', 'Marche nordique', 'Renforcement musculaire', 'Retour à la marche', 'Étirements']

const DEFAULT_NORDIQUE_CARDS = [
  { eyebrow: 'Mardi après-midi', titre: 'Séance hebdomadaire',   texte: 'Calendrier variable — consulter la page planning pour les horaires exacts.' },
  { eyebrow: 'Samedi matin',     titre: 'Séance hebdomadaire',   texte: 'Calendrier disponible en ligne.' },
  { eyebrow: 'Ponctuel',         titre: 'Sorties nocturnes',     texte: 'À certaines dates, annoncées dans le planning. Lampe frontale recommandée.' },
  { eyebrow: 'Encadrement',      titre: 'Animateurs formés FFR', texte: 'Pierre et Danièle assurent les séances, formés par la Fédération Française de Randonnée.' },
]

const DEFAULT_GROUPES = [
  { id: 'g1', groupe: 'Groupe 1',  distance: '12 à 14 km', retour: '17h30', rdv: 'Parking Leclerc' },
  { id: 'g2', groupe: 'Groupe 2A', distance: '10 à 12 km', retour: '17h00', rdv: 'Parking Leclerc' },
  { id: 'g3', groupe: 'Groupe 2B', distance: '8 à 10 km',  retour: '16h30', rdv: 'Parking Leclerc' },
  { id: 'g4', groupe: 'Groupe 3',  distance: '7 à 9 km',   retour: '16h30', rdv: 'Parking Nickel'  },
  { id: 'g5', groupe: 'Groupe 4',  distance: '5 à 7 km',   retour: '16h30', rdv: 'Parking Nickel'  },
]

export default async function RandoPage() {
  const [blocks, groupes, nordiqueBlocks] = await Promise.all([
    getRandoPageBlocks(),
    getRandoJeudiGroupes(),
    getNordiquePageBlocks(),
  ])

  const bm  = Object.fromEntries(blocks.map(b => [b.block_key, b]))
  const vis = (key) => bm[key]?.visible !== false

  const nbm     = Object.fromEntries(nordiqueBlocks.map(b => [b.block_key, b]))
  const nVis    = (key) => nbm[key]?.visible !== false
  const nHeader = nbm.header?.content ?? {}

  const sortedBlocks = blocks
  const groupeList = groupes.length > 0 ? groupes : DEFAULT_GROUPES

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">

        {/* PAGE HEADER */}
        {sortedBlocks.map(block => {
          if (!block.visible || block.block_key !== 'header') return null
          const content = block.content ?? {}
          return (
            <div key="header" className="page-header">
              <div className="container">
                <div className="crumb">
                  <Link href="/">Accueil</Link>
                  <span>/</span>
                  <span>Activités</span>
                  <span>/</span>
                  <span>Randonnée</span>
                </div>
                <div className="page-header-eyebrow">
                  {content.eyebrow ?? 'Activités · Fédération Française de Randonnée'}
                </div>
                <h1>{content.titre ?? 'La Randonnée'}</h1>
                <p className="page-header-lede">
                  {content.lede ?? 'Forêt de Rambouillet et alentours. 5 groupes de niveau, sorties chaque jeudi et un dimanche sur deux, séjours en France.'}
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
                  {vis('intro')    && <li><a href="#intro" className="active">Introduction</a></li>}
                  {vis('jeudi')    && <li><a href="#jeudi">Le jeudi</a></li>}
                  {vis('dimanche') && <li><a href="#dimanche">Le dimanche</a></li>}
                  {vis('sejours')  && <li><a href="#sejours">Sorties & séjours</a></li>}
                  {vis('sante')    && <li><a href="#sante">Rando-Santé</a></li>}
                  <li><a href="#marche-nordique">Marche nordique</a></li>
                </ul>
              </aside>

              {/* MAIN CONTENT — iterated in ordre */}
              <div>
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
                            {content.titre ?? 'Marcher dans la forêt de Rambouillet'}
                          </h2>
                          <p style={{ fontSize: "1.12rem", color: "var(--ink-soft)" }}>
                            {content.texte ?? "Les randonnées se font en forêt de Rambouillet ou à proximité immédiate. Les adhérents se répartissent en 4 ou 5 groupes selon leurs possibilités ou affinités. Il est toujours possible de changer de groupe d'une fois sur l'autre."}
                          </p>
                          {(content.alerte || !content.titre) && (
                            <div style={{ background: "var(--accent-tint)", border: "1px solid var(--accent-soft)", borderRadius: "var(--r-md)", padding: 20, margin: "20px 0", fontSize: "0.96rem" }}>
                              <strong>Important :</strong>{' '}
                              {content.alerte ?? "tout randonneur devrait avoir dans son sac la fiche individuelle de santé. Elle contribue à renforcer la sécurité lors des sorties."}{' '}
                              {(content.alerte_lien || !content.titre) && (
                                <a href={content.alerte_lien ?? '#'} style={{ fontWeight: 600 }}>
                                  {content.alerte_lien_texte ?? 'Télécharger la fiche'}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )

                    case 'jeudi':
                      return (
                        <div key="jeudi">
                          <h3 id="jeudi" style={{ marginTop: 40, fontFamily: "var(--serif)", fontSize: "1.8rem" }}>
                            {content.titre ?? 'Les randonnées du jeudi'}
                          </h3>
                          <p>{content.intro ?? '5 groupes de niveau, chaque jeudi après-midi.'}</p>
                          <table className="tbl" style={{ marginTop: 16 }}>
                            <thead>
                              <tr><th>Groupe</th><th>Distance</th><th>Retour vers</th><th>Point de RDV</th></tr>
                            </thead>
                            <tbody>
                              {groupeList.map(g => (
                                <tr key={g.id}>
                                  <td><strong>{g.groupe}</strong></td>
                                  <td>{g.distance}</td>
                                  <td>{g.retour}</td>
                                  <td>{g.rdv}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {(content.note || !content.titre) && (
                            <p style={{ marginTop: 12, fontSize: "0.92rem", color: "var(--ink-mute)" }}>
                              {content.note ?? "Les groupes 2A et 2B pourront être réunis en fonction du nombre d'animateurs disponibles. Les départs se font en covoiturage."}
                            </p>
                          )}
                          <Link
                            className="btn btn-primary"
                            style={{ marginTop: 20, display: "inline-flex" }}
                            href="/planning/randonnee"
                          >
                            Voir le planning des sorties
                          </Link>
                        </div>
                      )

                    case 'dimanche':
                      return (
                        <div key="dimanche">
                          <h3 id="dimanche" style={{ marginTop: 40, fontFamily: "var(--serif)", fontSize: "1.8rem" }}>
                            {content.titre ?? 'Les randonnées du dimanche'}
                          </h3>
                          <p>
                            {content.texte1 ?? 'Environ tous les 15 jours. Parcours de 9 à 11 km. Rassemblement à 8h45 sur le parking du centre Leclerc, départ à 9h, retour vers midi.'}
                          </p>
                          <p style={{ color: "var(--ink-soft)", fontSize: "0.96rem" }}>
                            {content.texte2 ?? "Conditions : être inscrit à la section marche de l'AGMR. Une sortie d'essai est possible sans inscription."}
                          </p>
                        </div>
                      )

                    case 'sejours':
                      return (
                        <div key="sejours">
                          <h3 id="sejours" style={{ marginTop: 40, fontFamily: "var(--serif)", fontSize: "1.8rem" }}>
                            {content.titre ?? 'Sorties à la journée et séjours'}
                          </h3>
                          <p>
                            {content.texte ?? 'Sorties à thèmes plusieurs fois par trimestre, en train, en car ou en covoiturage. 1 séjour en car chaque saison + plusieurs séjours en covoiturage.'}
                          </p>
                          <Link
                            className="btn btn-green"
                            style={{ marginTop: 12, display: "inline-flex" }}
                            href={content.cta_lien ?? '/actualites/sejours'}
                          >
                            {content.cta_texte ?? 'Voir les séjours'}
                          </Link>
                        </div>
                      )

                    case 'temoignage':
                      return (
                        <div key="temoignage" className="quote" style={{ padding: "48px 0 24px", marginTop: 32 }}>
                          <div className="quote-body" style={{ padding: 0 }}>
                            <div className="quote-text" style={{ fontSize: "1.7rem" }}>
                              « {content.citation ?? "On marche en silence dans la forêt, puis on rit fort autour d'un verre. C'est ça, l'esprit AGMR."} »
                            </div>
                            <div className="quote-attr">
                              <div className="quote-avatar">
                                {(content.auteur ?? 'Jean-Pierre, animateur rando').charAt(0).toUpperCase()}
                              </div>
                              <div className="quote-attr-text">
                                <span className="quote-attr-name">{content.auteur ?? 'Jean-Pierre, animateur rando'}</span>
                                <span className="quote-attr-role">{content.role ?? 'Bénévole depuis 2014'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )

                    case 'sante':
                      return (
                        <div key="sante" style={{ marginTop: 32, padding: 32, background: "var(--green-tint)", borderRadius: "var(--r-md)" }}>
                          <h3 id="sante" style={{ marginBottom: 10 }}>
                            {content.titre ?? 'Rando-Santé'}
                          </h3>
                          <p style={{ color: "var(--ink-soft)", marginBottom: 14 }}>
                            {content.texte ?? "Plus lentement, moins longtemps et moins loin. Activité destinée aux personnes atteintes de diverses pathologies. L'AGMR a obtenu le label « Santé » de la FFR."}
                          </p>
                          <Link className="btn btn-green btn-sm" href={content.cta_lien ?? '/activites/sante'}>
                            {content.cta_texte ?? 'En savoir plus'}
                          </Link>
                        </div>
                      )

                    default:
                      return <GenericBlockRenderer key={block.block_key} block={block} />
                  }
                })}

                {/* MARCHE NORDIQUE — contenu fusionné depuis /activites/nordique */}
                <div id="marche-nordique" style={{ marginTop: 56, paddingTop: 40, borderTop: "1px solid var(--line)" }}>
                  <div className="page-header-eyebrow">{nHeader.eyebrow ?? 'Activités · Marche dynamique'}</div>
                  <h2 style={{ fontSize: "2.2rem", marginBottom: 18 }}>
                    {nHeader.titre ?? 'La Marche Nordique'}
                  </h2>
                  <p style={{ fontSize: "1.12rem", color: "var(--ink-soft)" }}>
                    {nHeader.lede ?? "Plus dynamique que la randonnée, elle accentue le mouvement de balancier des bras à l'aide de deux bâtons. Le corps entier est mobilisé."}
                  </p>

                  {nordiqueBlocks.map(block => {
                    if (!block.visible || block.block_key === 'header') return null
                    const content = block.content ?? {}

                    switch (block.block_key) {
                      case 'intro':
                        return (
                          <div key="n-intro">
                            <p style={{ fontSize: "1.15rem", color: "var(--ink-soft)", fontFamily: "var(--serif)", fontStyle: "italic", margin: "24px 0 20px" }}>
                              {content.quote ?? "En appuyant sur les bâtons, on va plus vite et on fait travailler le haut du corps. La dépense d'énergie est accrue — et le plaisir arrive dès les premières foulées, car la technique est simple."}
                            </p>
                            <div style={{ background: "var(--accent-tint)", borderRadius: "var(--r-md)", padding: "20px 24px", margin: "20px 0", display: "flex", gap: 14, alignItems: "center" }}>
                              <Icon name="leaf" size={20}/>
                              <strong>{content.alerte ?? 'On peut vous prêter des bâtons pour un essai.'}</strong>
                            </div>
                          </div>
                        )

                      case 'seance': {
                        const steps = Array.isArray(content.steps) ? content.steps : DEFAULT_NORDIQUE_STEPS
                        return (
                          <div key="n-seance">
                            <h3 style={{ marginTop: 40, fontFamily: "var(--serif)", fontSize: "1.8rem" }}>{content.titre ?? 'Comment se déroule une séance'}</h3>
                            <p>{content.texte ?? 'Chaque séance dure entre 1h30 et 2h.'}</p>
                            <ol style={{ fontSize: "1.05rem", lineHeight: 1.9, margin: "20px 0 0 20px" }}>
                              {steps.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                          </div>
                        )
                      }

                      case 'quand': {
                        const cards = Array.isArray(content.cards) ? content.cards : DEFAULT_NORDIQUE_CARDS
                        return (
                          <div key="n-quand">
                            <h3 style={{ marginTop: 40, fontFamily: "var(--serif)", fontSize: "1.8rem" }}>{content.titre ?? 'Quand pratiquer'}</h3>
                            <div className="affil-grid">
                              {cards.map((card, i) => (
                                <div key={i} className="affil">
                                  <div className="affil-eyebrow">{card.eyebrow}</div>
                                  <h4>{card.titre}</h4>
                                  <p>{card.texte}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      default:
                        return <GenericBlockRenderer key={block.block_key} block={block} />
                    }
                  })}

                  <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link className="btn btn-primary" href="/planning/randonnee">Voir le planning</Link>
                    <Link className="btn btn-ghost" href="/inscriptions">S'inscrire</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer/>
    </div>
  )
}
