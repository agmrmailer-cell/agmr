export const dynamic = 'force-dynamic'
import Link from 'next/link'
import GenericBlockRenderer from '@/components/blocks/GenericBlockRenderer'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import { getSantePageBlocks } from '@/lib/queries'
import Editable from '@/components/editable/Editable'
import { blockSrc } from '@/lib/editable-src'
import { renderBlocks } from '@/components/editable/renderBlocks'
import { getEditMode } from '@/lib/edit-mode'

export const metadata = { title: "Santé — AGMR" }

export default async function SantePage() {
  const blocks = await getSantePageBlocks()
  const editMode = await getEditMode()

  const bm  = Object.fromEntries(blocks.map(b => [b.block_key, b]))
  const vis = (key) => bm[key]?.visible !== false
  const sortedBlocks = blocks

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">

        {renderBlocks({ table: 'sante_page_blocks', editMode, movable: false, deletable: false }, sortedBlocks, block => {
          if (!block.visible || block.block_key !== 'header') return null
          const content = block.content ?? {}
          return (
            <div key="header" className="page-header">
              <div className="container">
                <div className="crumb">
                  <Link href="/">Accueil</Link><span>/</span>
                  <span>Santé</span>
                </div>
                <div className="page-header-eyebrow"><Editable plain src={blockSrc('sante_page_blocks', block.block_key, 'eyebrow')} value={content.eyebrow} fallback={'Santé par le Sport · Activités Physiques Adaptées'}/></div>
                <h1><Editable plain src={blockSrc('sante_page_blocks', block.block_key, 'titre')} value={content.titre} fallback={"Prescri'Forme & Rando-Santé"}/></h1>
                <Editable src={blockSrc('sante_page_blocks', block.block_key, 'lede')} value={content.lede} fallback={"Cours d'Activités Physiques Adaptées (APA) sur prescription médicale, pour les affections de longue durée. Reprenez une activité physique en toute sécurité."} className="page-header-lede"/>
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
                  {vis('prescri')    && <li><a href="#prescri" className="active">Prescri'Forme</a></li>}
                  {vis('rando_sante')&& <li><a href="#rando-sante">Rando-Santé</a></li>}
                  {vis('temoignage') && <li><a href="#temoignage">Témoignage</a></li>}
                </ul>
              </aside>
              <div>

                {renderBlocks({ table: 'sante_page_blocks', editMode }, sortedBlocks, block => {
                  if (!block.visible) return null
                  const content = block.content ?? {}

                  switch (block.block_key) {
                    case 'header':
                      return null

                    case 'prescri':
                      return (
                        <div key="prescri">
                          <h2 id="prescri" style={{ fontSize: "2.2rem" }}>
                            <Editable plain src={blockSrc('sante_page_blocks', block.block_key, 'titre')} value={content.titre} fallback={"Prescri'Forme — Sport sur ordonnance"}/>
                          </h2>
                          <Editable src={blockSrc('sante_page_blocks', block.block_key, 'texte1')} value={content.texte1} fallback={"Si vous avez du diabète, êtes en surpoids ou souffrez d'hypertension artérielle et avez besoin de pratiquer un sport, demandez à votre médecin de vous prescrire de la gymnastique adaptée pour les ALD par le biais du programme Prescri'Forme."} style={{ fontSize: "1.12rem", color: "var(--ink-soft)" }}/>
                          <Editable src={blockSrc('sante_page_blocks', block.block_key, 'texte2')} value={content.texte2} fallback={"Depuis septembre 2019, des cours d'Activités Physiques Adaptées sont proposés avec des animateurs spécialement formés, pour permettre de reprendre une activité physique en toute sécurité et dans la bonne humeur."}/>
                          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div style={{ padding: 22, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
                              <div style={{ fontSize: "0.74rem", color: "var(--ink-mute)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Certification</div>
                              <Editable src={blockSrc('sante_page_blocks', block.block_key, 'cert_texte')} value={content.cert_texte} fallback={"Section gym certifiée auprès de la DRJSCS Yvelines et répertoriée au CROS Île-de-France."} style={{ margin: 0, fontSize: "0.94rem" }}/>
                            </div>
                            <div style={{ padding: 22, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
                              <div style={{ fontSize: "0.74rem", color: "var(--ink-mute)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>En savoir plus</div>
                              <p style={{ margin: 0, fontSize: "0.94rem" }}>
                                <a href={content.lien_url ?? 'http://www.lasanteparlesport.fr'} target="_blank" rel="noopener">
                                  <Editable plain src={blockSrc('sante_page_blocks', block.block_key, 'lien_texte')} value={content.lien_texte} fallback={'lasanteparlesport.fr'}/>
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      )

                    case 'rando_sante':
                      return (
                        <div key="rando_sante">
                          <h2 id="rando-sante" style={{ marginTop: 56, fontSize: "2.2rem" }}>
                            <Editable plain src={blockSrc('sante_page_blocks', block.block_key, 'titre')} value={content.titre} fallback={'Rando-Santé — Marche adaptée'}/>
                          </h2>
                          <Editable src={blockSrc('sante_page_blocks', block.block_key, 'texte')} value={content.texte} fallback={"Pour la marche, l'AGMR a obtenu le label Santé de la FFR, avec des animateurs formés à l'accompagnement de personnes ayant des contraintes de santé."}/>
                          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.4rem", color: "var(--accent-deep)", margin: "20px 0", paddingLeft: 20, borderLeft: "3px solid var(--accent)" }}>
                            « <Editable inline src={blockSrc('sante_page_blocks', block.block_key, 'citation')} value={content.citation} fallback={"Plus lentement, moins longtemps et moins loin — pour que la marche reste accessible à tous."}/> »
                          </p>
                        </div>
                      )

                    case 'temoignage':
                      return (
                        <div key="temoignage" id="temoignage" className="quote" style={{ padding: "48px 0 24px", marginTop: 32 }}>
                          <div className="quote-body" style={{ padding: 0 }}>
                            <div className="quote-text" style={{ fontSize: "1.7rem" }}>
                              « <Editable inline src={blockSrc('sante_page_blocks', block.block_key, 'citation')} value={content.citation} fallback={"Mon médecin m'a prescrit de l'activité physique. J'ai trouvé Prescri'Forme : adapté, attentif, jamais infantilisant."}/> »
                            </div>
                            <div className="quote-attr">
                              <div className="quote-avatar">
                                {(content.auteur ?? 'Henri, 71 ans').charAt(0).toUpperCase()}
                              </div>
                              <div className="quote-attr-text">
                                <span className="quote-attr-name"><Editable plain src={blockSrc('sante_page_blocks', block.block_key, 'auteur')} value={content.auteur} fallback={'Henri, 71 ans'}/></span>
                                <span className="quote-attr-role"><Editable plain src={blockSrc('sante_page_blocks', block.block_key, 'role')} value={content.role} fallback={"Cours Prescri'Forme"}/></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )

                    default:
                      return <GenericBlockRenderer key={block.block_key} block={block} table="sante_page_blocks" />
                  }
                })}

                <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                  <Link className="btn btn-primary" href="/contact">Parler à un animateur</Link>
                  <Link className="btn btn-ghost" href="/inscriptions">S'inscrire</Link>
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
