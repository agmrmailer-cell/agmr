export const dynamic = 'force-dynamic'
import Link from 'next/link'
import GenericBlockRenderer from '@/components/blocks/GenericBlockRenderer'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ExternalLinksPanel from '@/components/links/ExternalLinksPanel'
import { formatDateFR, catLabel } from '@/utils/format'
import { getSiteStats, getHomeBlocks, getActualites, getExternalLinks, getSiteTexts } from '@/lib/queries'
import { richTextToPlain } from '@/lib/rich-text'
import Editable from '@/components/editable/Editable'
import { blockSrc, textSrc, rowSrc } from '@/lib/editable-src'
import { renderBlocks } from '@/components/editable/renderBlocks'
import BlockControls from '@/components/editable/BlockControls'
import { getEditMode } from '@/lib/edit-mode'
import ImageEditButton from '@/components/editable/ImageEditButton'

const TRIO_DEFS = [
  { key: 'trio_gym',      cls: 'trio-photo-gym',      n: '01' },
  { key: 'trio_rando',    cls: 'trio-photo-rando',     n: '02' },
  // 3e rubrique : Santé (APA, Rando-Santé, Marche Nordique Santé) — remplace l'ancienne carte Marche nordique
  {
    key: 'trio_sante', cls: 'trio-photo-sante', n: '03', label: 'Carte Santé', after: 'trio_nordique',
    defaults: {
      titre: 'La Santé',
      description: "<p>Activité Physique Adaptée (Prescri'Forme), Rando-Santé et Marche Nordique Santé : reprendre une activité en douceur, avec des animateurs formés.</p>",
      cta: 'En savoir plus',
      stat: 'APA · Rando-Santé · Nordique',
      lien: '/activites/sante',
      tag: 'Santé',
    },
  },
]

const TRIO_KEYS = new Set(TRIO_DEFS.map(d => d.key))
// Blocs rendus dans la section des 3 rubriques (l'ancienne carte nordique n'est plus affichée)
const inTrio = key => TRIO_KEYS.has(key) || key === 'trio_nordique'

export default async function HomePage() {
  const [stats, blocks, actualites, randoSanteLinks] = await Promise.all([
    getSiteStats(),
    getHomeBlocks(),
    getActualites(),
    getExternalLinks('home-rando-sante'),
  ])
  const editMode = await getEditMode()
  const t = await getSiteTexts('home')

  const bm = Object.fromEntries(blocks.map(b => [b.block_key, b]))
  const c  = (key) => ({ ...(TRIO_DEFS.find(d => d.key === key)?.defaults ?? {}), ...(bm[key]?.content ?? {}) })
  // Ordre d'une carte : celui de son bloc, ou à défaut celui du bloc qu'elle remplace
  const trioOrder = def => bm[def.key]?.ordre ?? bm[def.after]?.ordre ?? 999

  // sortedBlocks already ordered by ordre ASC from the query
  const sortedBlocks = blocks

  // Collect visible trio blocks in sorted order for the grouped section
  const visibleTrios = TRIO_DEFS.filter(t => {
    const b = bm[t.key]
    if (!b) return !!t.defaults // carte pas encore enregistrée : affichée avec son contenu par défaut
    return b.visible !== false || editMode
  }).sort((a, b) => trioOrder(a) - trioOrder(b))

  const firstTrioKey = sortedBlocks.find(block => (block.visible || editMode) && inTrio(block.block_key))?.block_key

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">

        {renderBlocks({ table: 'home_blocks', editMode, frame: key => !inTrio(key) }, sortedBlocks, block => {
          if (!block.visible) return null
          const content = block.content ?? {}

          // Trio blocks: render the whole trio section on the first trio encountered
          if (inTrio(block.block_key)) {
            if (block.block_key !== firstTrioKey) return null
            if (visibleTrios.length === 0) return null
            return (
              <section key="trio" className="section section-cream">
                <div className="container">
                  <div className="section-head">
                    <div className="section-eyebrow"><Editable plain src={textSrc('home', 'trio_eyebrow')} value={t.trio_eyebrow}/></div>
                    <h2 className="section-title"><Editable plain src={textSrc('home', 'trio_titre')} value={t.trio_titre}/></h2>
                    <Editable src={textSrc('home', 'trio_lede')} value={t.trio_lede} className="section-lede"/>
                  </div>
                  <div className="trio">
                    {visibleTrios.map(({ key, cls, n, label }) => {
                      const tc = c(key)
                      const card = (
                        <Link key={key} className="trio-card" href={tc.lien ?? '#'}>
                          <div className={`trio-photo ${cls}`} style={tc.photo_url ? { backgroundImage: `url(${tc.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} data-tag={tc.tag ?? ''}>
                            <div className="trio-photo-overlay"/>
                            <div className="trio-photo-num">{n}</div>
                            <ImageEditButton src={blockSrc('home_blocks', key, 'photo_url', label)} value={tc.photo_url} aspect={4 / 3} folder="accueil"/>
                          </div>
                          <div className="trio-body">
                            <h3><Editable plain src={blockSrc('home_blocks', key, 'titre', label)} value={tc.titre}/></h3>
                            <Editable src={blockSrc('home_blocks', key, 'description', label)} value={tc.description}/>
                            <div className="trio-foot">
                              <span className="trio-link"><Editable plain src={blockSrc('home_blocks', key, 'cta', label)} value={tc.cta}/> →</span>
                              <span className="trio-stat"><Editable plain src={blockSrc('home_blocks', key, 'stat', label)} value={tc.stat}/></span>
                            </div>
                          </div>
                        </Link>
                      )
                      if (!editMode) return card
                      return (
                        <BlockControls
                          key={key}
                          table="home_blocks"
                          id={bm[key]?.id ?? null}
                          blockKey={key}
                          label={bm[key]?.label ?? key}
                          visible={bm[key]?.visible !== false}
                          full={[]}
                          seq={[key]}
                          movable={false}
                          deletable={false}
                        >
                          {card}
                        </BlockControls>
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
                  <ImageEditButton src={blockSrc('home_blocks', block.block_key, 'photo_url')} value={content.photo_url} folder="accueil" position="bottom-left"/>
                  <div className="hero-content">
                    <span className="hero-eyebrow"><Editable plain src={blockSrc('home_blocks', block.block_key, 'eyebrow')} value={content.eyebrow} fallback={'Depuis 1970 · Rambouillet'}/></span>
                    <h1>
                      <Editable plain src={blockSrc('home_blocks', block.block_key, 'titre_ligne1')} value={content.titre_ligne1} fallback={'Bougez, marchez,'}/><br/>
                      <em><Editable plain src={blockSrc('home_blocks', block.block_key, 'titre_ligne2')} value={content.titre_ligne2} fallback={'respirez ensemble.'}/></em>
                    </h1>
                    <Editable src={blockSrc('home_blocks', block.block_key, 'sous_titre')} value={content.sous_titre} fallback={'Gymnastique, randonnée, marche nordique.\nDans un esprit de détente et de convivialité.'} className="hero-sub" style={{ whiteSpace: 'pre-line' }}/>
                    <div className="hero-actions">
                      <Link className="btn btn-primary btn-lg" href={content.cta1_lien ?? '/inscriptions'}>
                        <Editable plain src={blockSrc('home_blocks', block.block_key, 'cta1_texte')} value={content.cta1_texte} fallback={"Je m'inscris"}/>
                      </Link>
                      <Link className="btn btn-light btn-lg" href={content.cta2_lien ?? '/activites/gym'}>
                        <Editable plain src={blockSrc('home_blocks', block.block_key, 'cta2_texte')} value={content.cta2_texte} fallback={'Découvrir nos activités'}/>
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
                        <ImageEditButton src={blockSrc('home_blocks', block.block_key, 'photo_url')} value={content.photo_url} aspect={4 / 5} folder="accueil"/>
                        <div className="manifesto-badge">
                          <strong><Editable plain src={blockSrc('home_blocks', block.block_key, 'badge')} value={content.badge} fallback={"L'épanouissement avant la performance"}/></strong>
                          <Editable plain src={blockSrc('home_blocks', block.block_key, 'badge_meta')} value={content.badge_meta} fallback={'Charte AGMR — 2018'}/>
                        </div>
                      </div>
                      <div className="manifesto-text">
                        <div className="section-eyebrow"><Editable plain src={blockSrc('home_blocks', block.block_key, 'eyebrow')} value={content.eyebrow} fallback={'Notre philosophie'}/></div>
                        <h2 style={{ whiteSpace: 'pre-line' }}><Editable plain src={blockSrc('home_blocks', block.block_key, 'titre')} value={content.titre} fallback={"Le plaisir d'abord,\nle reste suit."}/></h2>
                        <Editable src={blockSrc('home_blocks', block.block_key, 'texte')} value={content.texte}/>
                        <div className="pull"><Editable plain src={blockSrc('home_blocks', block.block_key, 'pull')} value={content.pull}/></div>
                        <div style={{ marginTop: 28, display: "flex", gap: 14 }}>
                          <Link className="btn btn-ghost" href={content.cta1_lien ?? '/association'}>
                            <Editable plain src={blockSrc('home_blocks', block.block_key, 'cta1_texte')} value={content.cta1_texte} fallback={"L'association"}/>
                          </Link>
                          <Link className="btn btn-ghost" href={content.cta2_lien ?? '/inscriptions'}>
                            <Editable plain src={blockSrc('home_blocks', block.block_key, 'cta2_texte')} value={content.cta2_texte} fallback={"S'inscrire"}/>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )

            case 'actualites':
              return actualites.length > 0 || randoSanteLinks.length > 0 ? (
                <section key="actualites" className="section">
                  <div className="container">
                    {actualites.length > 0 && (
                      <>
                        <div className="section-head" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", maxWidth:"none" }}>
                          <div>
                            <div className="section-eyebrow"><Editable plain src={textSrc('home', 'news_eyebrow')} value={t.news_eyebrow}/></div>
                            <h2 className="section-title"><Editable plain src={textSrc('home', 'news_titre')} value={t.news_titre}/></h2>
                          </div>
                          <Link className="btn btn-ghost" href="/actualites">
                            <Editable plain src={textSrc('home', 'news_lien')} value={t.news_lien}/> →
                          </Link>
                        </div>
                        <div className="news-split">
                          <article className="news-feature">
                            <div className="news-feature-img" style={actualites[0].image_url ? {
                              backgroundImage: `url(${actualites[0].image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            } : undefined}>
                              <ImageEditButton src={rowSrc('actualites', actualites[0].id, 'image_url')} value={actualites[0].image_url} folder="actualites"/>
                            </div>
                            <div className="news-feature-body">
                              <div className="news-meta">
                                <span className={`news-cat news-cat-${actualites[0].cat}`}>
                                  {catLabel(actualites[0].cat)}
                                </span>
                                <span>{formatDateFR(actualites[0].date)}</span>
                              </div>
                              <h3><Editable plain src={rowSrc('actualites', actualites[0].id, 'title')} value={actualites[0].title}/></h3>
                              <Editable src={rowSrc('actualites', actualites[0].id, 'excerpt')} value={actualites[0].excerpt}/>
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
                                  <h4><Editable plain src={rowSrc('actualites', n.id, 'title')} value={n.title}/></h4>
                                  <p>{richTextToPlain(n.excerpt).slice(0, 90)}{richTextToPlain(n.excerpt).length > 90 ? '…' : ''}</p>
                                </div>
                                <a href="/actualites" className="news-side-link">Lire la suite →</a>
                              </article>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    <ExternalLinksPanel
                      links={randoSanteLinks}
                      title="Rando-Sante"
                      intro="Informations et planning utiles pour participer aux activites adaptees."
                      compact
                    />
                  </div>
                </section>
              ) : null

            case 'cta_banner':
              return (
                <section key="cta_banner" className="section" style={{ paddingTop: 0 }}>
                  <div className="container">
                    <div className="cta-banner">
                      <div style={{ position: "relative" }}>
                        <h3><Editable plain src={blockSrc('home_blocks', block.block_key, 'titre')} value={content.titre} fallback={"Première séance d'essai gratuite."}/></h3>
                        <p><Editable plain src={blockSrc('home_blocks', block.block_key, 'sous_titre')} value={content.sous_titre} fallback={"Sur simple inscription par téléphone ou en ligne. Aucun engagement."}/></p>
                      </div>
                      <div style={{ display: "flex", gap: 12, position: "relative" }}>
                        <Link className="btn btn-light btn-lg" href={content.cta1_lien ?? '/inscriptions'}>
                          <Editable plain src={blockSrc('home_blocks', block.block_key, 'cta1_texte')} value={content.cta1_texte} fallback={"S'inscrire"}/>
                        </Link>
                        <Link className="btn btn-light btn-lg" href={content.cta2_lien ?? '/contact'}>
                          <Editable plain src={blockSrc('home_blocks', block.block_key, 'cta2_texte')} value={content.cta2_texte} fallback={"Nous contacter"}/>
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
              return <GenericBlockRenderer key={block.block_key} block={block} table="home_blocks" />
          }
        })}


      </main>
      <Footer/>
    </div>
  )
}
