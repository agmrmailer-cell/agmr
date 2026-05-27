import Link from 'next/link'
import Header from '@/components/shell/Header'
import Footer from '@/components/shell/Footer'
import { formatDateFR, catLabel } from '@/utils/format'
import { getSiteStats, getHomeBlocks, getActualites } from '@/lib/queries'

const TRIO_DEFS = [
  { key: 'trio_gym',      cls: 'trio-photo-gym',      n: '01' },
  { key: 'trio_rando',    cls: 'trio-photo-rando',     n: '02' },
  { key: 'trio_nordique', cls: 'trio-photo-nordique',  n: '03' },
]

export default async function HomePage() {
  const [stats, blocks, actualites] = await Promise.all([
    getSiteStats(),
    getHomeBlocks(),
    getActualites(),
  ])

  const bm = Object.fromEntries(blocks.map(b => [b.block_key, b]))
  const c  = (key) => bm[key]?.content ?? {}
  const vis = (key) => bm[key]?.visible !== false

  const hero      = c('hero')
  const manifesto = c('manifesto')
  const cta       = c('cta_banner')
  const visibleTrios = TRIO_DEFS.filter(t => vis(t.key))

  return (
    <div className="page-shell">
      <Header/>
      <main className="page-main">

        {/* HERO */}
        {vis('hero') && (
          <section className="hero">
            <div className="hero-photo hero-photo-forest">
              <div className="hero-photo-trees"/>
              <div className="hero-grain"/>
            </div>
            <div className="hero-content">
              <span className="hero-eyebrow">{hero.eyebrow ?? 'Depuis 1970 · Rambouillet'}</span>
              <h1>
                {hero.titre_ligne1 ?? 'Bougez, marchez,'}<br/>
                <em>{hero.titre_ligne2 ?? 'respirez ensemble.'}</em>
              </h1>
              <p className="hero-sub" style={{ whiteSpace: 'pre-line' }}>
                {hero.sous_titre ?? 'Gymnastique, randonnee, marche nordique.\nDans un esprit de detente et de convivialite.'}
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-lg" href={hero.cta1_lien ?? '/inscriptions'}>
                  {hero.cta1_texte ?? "Je m'inscris"}
                </Link>
                <Link className="btn btn-light btn-lg" href={hero.cta2_lien ?? '/activites/gym'}>
                  {hero.cta2_texte ?? 'Decouvrir nos activites'}
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
        )}

        {/* TRIO */}
        {visibleTrios.length > 0 && (
          <section className="section section-cream">
            <div className="container">
              <div className="section-head">
                <div className="section-eyebrow">Trois activites, un meme esprit</div>
                <h2 className="section-title">Choisissez votre tempo.</h2>
                <p className="section-lede">
                  Une adhesion unique donne acces a la gym et/ou a la marche.
                  A vous de construire votre semaine.
                </p>
              </div>
              <div className="trio">
                {visibleTrios.map(({ key, cls, n }) => {
                  const tc = c(key)
                  return (
                    <Link key={key} className="trio-card" href={tc.lien ?? '#'}>
                      <div className={`trio-photo ${cls}`} style={tc.photo_url ? { backgroundImage: `url(${tc.photo_url})` } : undefined} data-tag={tc.tag ?? ''}>
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
        )}

        {/* MANIFESTO */}
        {vis('manifesto') && (
          <section className="section">
            <div className="container">
              <div className="manifesto">
                <div className="manifesto-vis">
                  <div className="manifesto-vis-photo" style={manifesto.photo_url ? { backgroundImage: `url(${manifesto.photo_url})` } : undefined}/>
                  <div className="manifesto-badge">
                    <strong>{manifesto.badge ?? "L'epanouissement avant la performance"}</strong>
                    {manifesto.badge_meta ?? 'Charte AGMR — 2018'}
                  </div>
                </div>
                <div className="manifesto-text">
                  <div className="section-eyebrow">{manifesto.eyebrow ?? 'Notre philosophie'}</div>
                  <h2 style={{ whiteSpace: 'pre-line' }}>{manifesto.titre ?? "Le plaisir d'abord,\nle reste suit."}</h2>
                  <p>{manifesto.texte}</p>
                  <div className="pull">{manifesto.pull}</div>
                  <div style={{ marginTop: 28, display: "flex", gap: 14 }}>
                    <Link className="btn btn-ghost" href={manifesto.cta1_lien ?? '/association'}>
                      {manifesto.cta1_texte ?? "L'association"}
                    </Link>
                    <Link className="btn btn-ghost" href={manifesto.cta2_lien ?? '/inscriptions'}>
                      {manifesto.cta2_texte ?? "S'inscrire"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STATS */}
        <section className="stats-band">
          <div className="stats-grid">
            {stats.band.map(([n, l]) => (
              <div key={n} className="stat-item">
                <div className="stat-num">{n}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ACTUALITES */}
        {vis('actualites') && actualites.length > 0 && (
          <section className="section">
            <div className="container">
              <div className="section-head" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", maxWidth:"none" }}>
                <div>
                  <div className="section-eyebrow">A la une</div>
                  <h2 className="section-title">Dernieres actualites</h2>
                </div>
                <Link className="btn btn-ghost" href="/actualites">
                  Toutes les actualites →
                </Link>
              </div>
              <div className="news-split">
                <article className="news-feature">
                  <div className="news-feature-img"/>
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
                      <div className="news-meta">
                        <span className={`news-cat news-cat-${n.cat}`}>
                          {catLabel(n.cat)}
                        </span>
                        <span>{formatDateFR(n.date)}</span>
                      </div>
                      <h4>{n.title}</h4>
                      <p>{n.excerpt.slice(0, 90)}...</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        {vis('cta_banner') && (
          <section className="section" style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="cta-banner">
                <div style={{ position: "relative" }}>
                  <h3>{cta.titre ?? "Premiere seance d'essai gratuite."}</h3>
                  <p>{cta.sous_titre ?? "Sur simple inscription par telephone ou en ligne. Aucun engagement."}</p>
                </div>
                <div style={{ display: "flex", gap: 12, position: "relative" }}>
                  <Link className="btn btn-light btn-lg" href={cta.cta1_lien ?? '/inscriptions'}>
                    {cta.cta1_texte ?? "S'inscrire"}
                  </Link>
                  <Link className="btn btn-light btn-lg" href={cta.cta2_lien ?? '/contact'}>
                    {cta.cta2_texte ?? "Nous contacter"}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer/>
    </div>
  )
}
