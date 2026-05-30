export const dynamic = 'force-dynamic'
import Link from 'next/link'
import GenericBlockRenderer from '@/components/blocks/GenericBlockRenderer'
import Header from '@/components/shell/Header'
import Footer from '@/components/shell/Footer'
import Icon from '@/components/ui/Icon'
import { getNordiquePageBlocks } from '@/lib/queries'

export const metadata = { title: 'Marche Nordique — AGMR' }

const DEFAULT_STEPS = ['Échauffement', 'Marche nordique', 'Renforcement musculaire', 'Retour à la marche', 'Étirements']

const DEFAULT_CARDS = [
  { eyebrow: 'Mardi après-midi', titre: 'Séance hebdomadaire',   texte: 'Calendrier variable — consulter la page planning pour les horaires exacts.' },
  { eyebrow: 'Samedi matin',     titre: 'Séance hebdomadaire',   texte: 'Calendrier disponible en ligne.' },
  { eyebrow: 'Ponctuel',         titre: 'Sorties nocturnes',     texte: 'À certaines dates, annoncées dans le planning. Lampe frontale recommandée.' },
  { eyebrow: 'Encadrement',      titre: 'Animateurs formés FFR', texte: 'Pierre et Danièle assurent les séances, formés par la Fédération Française de Randonnée.' },
]

export default async function NordiquePage() {
  const blocks = await getNordiquePageBlocks()
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
                <div className="crumb">
                  <Link href="/">Accueil</Link><span>/</span>
                  <span>Activités</span><span>/</span>
                  <span>Marche nordique</span>
                </div>
                <div className="page-header-eyebrow">{content.eyebrow ?? 'Activités · Marche dynamique'}</div>
                <h1>{content.titre ?? 'La Marche Nordique'}</h1>
                <p className="page-header-lede">{content.lede ?? "Plus dynamique que la randonnée, elle accentue le mouvement de balancier des bras à l'aide de deux bâtons. Le corps entier est mobilisé."}</p>
              </div>
            </div>
          )
        })}

        <section className="section">
          <div className="container-narrow">

            {sortedBlocks.map(block => {
              if (!block.visible) return null
              const content = block.content ?? {}

              switch (block.block_key) {
                case 'header':
                  return null

                case 'intro': {
                  return (
                    <div key="intro">
                      <p style={{ fontSize: "1.2rem", color: "var(--ink-soft)", fontFamily: "var(--serif)", fontStyle: "italic", marginBottom: 32 }}>
                        {content.quote ?? "En appuyant sur les bâtons, on va plus vite et on fait travailler le haut du corps. La dépense d'énergie est accrue — et le plaisir arrive dès les premières foulées, car la technique est simple."}
                      </p>
                      <div style={{ background: "var(--accent-tint)", borderRadius: "var(--r-md)", padding: "20px 24px", margin: "32px 0", display: "flex", gap: 14, alignItems: "center" }}>
                        <Icon name="leaf" size={20}/>
                        <strong>{content.alerte ?? 'On peut vous prêter des bâtons pour un essai.'}</strong>
                      </div>
                    </div>
                  )
                }

                case 'seance': {
                  const steps = Array.isArray(content.steps) ? content.steps : DEFAULT_STEPS
                  return (
                    <div key="seance">
                      <h2 style={{ marginTop: 48, fontSize: "2rem" }}>{content.titre ?? 'Comment se déroule une séance'}</h2>
                      <p>{content.texte ?? 'Chaque séance dure entre 1h30 et 2h.'}</p>
                      <ol style={{ fontSize: "1.05rem", lineHeight: 1.9, margin: "20px 0 0 20px" }}>
                        {steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  )
                }

                case 'quand': {
                  const cards = Array.isArray(content.cards) ? content.cards : DEFAULT_CARDS
                  return (
                    <div key="quand">
                      <h2 style={{ marginTop: 48, fontSize: "2rem" }}>{content.titre ?? 'Quand pratiquer'}</h2>
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

            <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/planning/randonnee">Voir le planning</Link>
              <Link className="btn btn-ghost" href="/inscriptions">S'inscrire</Link>
              <Link className="btn btn-ghost" href="/contact">Nous contacter</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
