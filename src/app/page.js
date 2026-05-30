export const dynamic = 'force-dynamic'
import Link from 'next/link'
import GenericBlockRenderer from '@/components/blocks/GenericBlockRenderer'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import { formatDateFR, catLabel } from '@/utils/format'
import { getSiteStats, getHomeBlocks, getActualites } from '@/lib/queries'

const TRIO_DEFS = [
  { key: 'trio_gym',      cls: 'trio-photo-gym',      n: '01' },
  { key: 'trio_rando',    cls: 'trio-photo-rando',     n: '02' },
  { key: 'trio_nordique', cls: 'trio-photo-nordique',  n: '03' },
]

const TRIO_KEYS = new Set(['trio_gym', 'trio_rando', 'trio_nordique'])

export default async function HomePage() {
  const [stats, blocks, actualites] = await Promise.all([
    getSiteStats(),
    getHomeBlocks(),
    getActualites(),
  ])

  const bm = Object.fromEntries(blocks.map(b => [b.block_key, b]))
  const c  = (key) => bm[key]?.content ?? {}

  // sortedBlocks already ordered by ordre ASC from the query
  const sortedBlocks = blocks

  // Collect visible trio blocks in sorted order for the grouped section
  const visibleTrios = TRIO_DEFS.filter(t => {
    const b = bm[t.key]
    return b && b.visible !== false
  }).sort((a, b) => (bm[a.key]?.ordre ?? 0) - (bm[b.key]?.ordre ?? 0))

  // Track whether we already rendered the trio section
  let trioRendered = false

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">

        {sortedBlocks.map(block => {
          if (!block.visible) return null
          const content = block.content ?? {}

          // Trio blocks: render the whole trio section on the first trio encountered
          if (TRIO_KEYS.has(block.block_key)) {
            if (trioRendered) return null
            trioRendered = true
            if (visibleTrios.length === 0) return null
            return (
              <section key="trio" className="section section-cream">
                <div className="container">
                  <div className="section-head">
                    <div className="section-eyebrow">Trois activites, un meme esprit</div>
                    <h2 className="section-title">Choisissez votre tempo.</h2>
                    <p className="section-lede">
                      Une adhésion unique donne accès à la gym et/ou à la marche.
                      A vous de construire votre semaine.
                    </p>
                  </div>
                  <div className="trio">
                    {visibleTrios.map(({ key, cls, n }) => {
                      const tc = c(key)
                      return (
                        <Link key={key} className="trio-card" href={tc.lien ?? '#'}>
                          <div className={`trio-photo ${cls}`} style={tc.photo_url ? { backgroundImage: `url(${tc.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} data-tag={tc.tag ?? ''}>
                            <div className="trio-photo-overlay"/>
                            <div className="trio-photo-num">{n}</div>
                          </div>
                          <div className="trio-body">
                            <h3>{tc.titre}</h3>
                            <p>{tc.description}</p>
                            <div className="trio-foot">
                              <span className="trio-link">{tc.cta} →</span>
                              <span className="trio-stat">{tc.stat}</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          }

          switch (block.block_key) {
            case 'hero':
              return (
                <section key="hero" className="hero">
                  <div className="hero-photo hero-photo-forest" style={content.photo_url ? { backgroundImage: `url(${content.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                    {!content.photo_url && <div className="hero-photo-trees"/>}
                    <div className="hero-grain"/>
                  </div>
                  <div className="hero-content">
                    <span className="hero-eyebrow">{content.eyebrow ?? 'Depuis 1970 · Rambouillet'}</span>
                    <h1>
                      {content.titre_ligne1 ?? 'Bougez, marchez,'}<br/>
                      <em>{content.titre_ligne2 ?? 'respirez ensemble.'}</em>
                    </h1>
                    <p className="hero-sub" style={{ whiteSpace: 'pre-line' }}>
                      {content.sous_titre ?? 'Gymnastique, randonnée, marche nordique.\nDans un esprit de détente et de convivialité.'}
                    </p>
                    <div className="hero-actions">
                      <Link className="btn btn-primary btn-lg" href={content.cta1_lien ?? '/inscriptions'}>
                        {content.cta1_texte ?? "Je m'inscris"}
                      </Link>
                      <Link className="btn btn-light btn-lg" href={content.cta2_lien ?? '/activites/gym'}>
                        {content.cta2_texte ?? 'Découvrir nos activités'}
                      </Link>
                    </div>
                  </div>
                  <div className="hero-meta">
                    {stats.hero.map(([n, l]) => (
                      <div key={l}>
                        <div className="hero-meta-num">{n}</div>
                        <div className="hero-meta-lbl">{l}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )

            case 'manifesto':
              return (
                <section key="manifesto" className="section">
                  <div className="container">
                    <div className="manifesto">
                      <div className="manifesto-vis">
                        <div className="manifesto-vis-photo" style={content.photo_url ? { backgroundImage: `url(${content.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}/>
                        <div className="manifesto-badge">
                          <strong>{content.badge ?? "L'épanouissement avant la performance"}</strong>
                          {content.badge_meta ?? 'Charte AGMR — 2018'}
                        </div>
                      </div>
                      <div className="manifesto-text">
                        <div className="section-eyebrow">{content.eyebrow ?? 'Notre philosophie'}</div>
                        <h2 style={{ whiteSpace: 'pre-line' }}>{content.titre ?? "Le plaisir d'abord,\nle reste suit."}</h2>
                        <p>{content.texte}</p>
                        <div className="pull">{content.pull}</div>
                        <div style={{ marginTop: 28, display: "flex", gap: 14 }}>
                          <Link className="btn btn-ghost" href={content.cta1_lien ?? '/association'}>
                            {content.cta1_texte ?? "L'association"}
                          </Link>
                          <Link className="btn btn-ghost" href={content.cta2_lien ?? '/inscriptions'}>
                            {content.cta2_texte ?? "S'inscrire"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )

            case 'actualites':
              return actualites.length > 0 ? (
                <section key="actualites" className="section">
                  <div className="container">
                    <div className="section-head" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", maxWidth:"none" }}>
                      <div>
                        <div className="section-eyebrow">À la une</div>
                        <h2 className="section-title">Dernières actualités</h2>
                      </div>
                      <Link className="btn btn-ghost" href="/actualites">
                        Toutes les actualités →
                      </Link>
                    </div>
                    <div className="news-split">
                      <article className="news-feature">
                        <div className="news-feature-img" style={actualites[0].image_url ? {
                          backgroundImage: `url(${actualites[0].image_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        } : undefined}/>
                        <div className="news-feature-body">
                          <div className="news-meta">
                            <span className={`news-cat news-cat-${actualites[0].cat}`}>
                              {catLabel(actualites[0].cat)}
                            </span>
                            <span>{formatDateFR(actualites[0].date)}</span>
                          </div>
                          <h3>{actualites[0].title}</h3>
                          <p>{actualites[0].excerpt}</p>
                          <div style={{ marginTop: 18 }}>
                            <a href="#" style={{ fontWeight: 600 }}>Lire la suite →</a>
                          </div>
                        </div>
                      </article>
                      <div className="news-side-list">
                        {actualites.slice(1, 4).map(n => (
                          <article className="news-side" key={n.id}>
                            <div>
                              <div className="news-meta" style={{ marginBottom: 10 }}>
                                <span className={`news-cat news-cat-${n.cat}`}>{catLabel(n.cat)}</span>
                                <span>{formatDateFR(n.date)}</span>
                              </div>
                              <h4>{n.title}</h4>
                              <p>{n.excerpt.slice(0, 90)}{n.excerpt.length > 90 ? '…' : ''}</p>
                            </div>
                            <a href="/actualites" className="news-side-link">Lire la suite →</a>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null

            case 'cta_banner':
              return (
                <section key="cta_banner" className="section" style={{ paddingTop: 0 }}>
                  <div className="container">
                    <div className="cta-banner">
                      <div style={{ position: "relative" }}>
                        <h3>{content.titre ?? "Première séance d'essai gratuite."}</h3>
                        <p>{content.sous_titre ?? "Sur simple inscription par téléphone ou en ligne. Aucun engagement."}</p>
                      </div>
                      <div style={{ display: "flex", gap: 12, position: "relative" }}>
                        <Link className="btn btn-light btn-lg" href={content.cta1_lien ?? '/inscriptions'}>
                          {content.cta1_texte ?? "S'inscrire"}
                        </Link>
                        <Link className="btn btn-light btn-lg" href={content.cta2_lien ?? '/contact'}>
                          {content.cta2_texte ?? "Nous contacter"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              )

            case 'stats_band':
              return (
                <section key="stats_band" className="stats-band">
                  <div className="stats-grid">
                    {stats.band.map(([n, l]) => (
                      <div key={n} className="stat-item">
                        <div className="stat-num">{n}</div>
                        <div className="stat-label">{l}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )

            default:
              return <GenericBlockRenderer key={block.block_key} block={block} />
          }
        })}


      </main>
      <Footer/>
    </div>
  )
}
