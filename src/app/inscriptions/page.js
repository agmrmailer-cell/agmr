import Link from 'next/link'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ExternalLinksPanel from '@/components/links/ExternalLinksPanel'
import { getExternalLinks, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'
import Editable from '@/components/editable/Editable'
import { textSrc } from '@/lib/editable-src'

export const metadata = { title: "S'inscrire — AGMR" }

export default async function InscriptionsPage() {
  const [paymentLinks, t] = await Promise.all([getExternalLinks('inscriptions'), getSiteTexts('inscriptions')])

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t} page="inscriptions"/>

        <section className="section">
          <div className="container-narrow">
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "32px 36px" }}>
                <div className="page-header-eyebrow" style={{ color: "var(--accent)", marginBottom: 16 }}><Editable plain src={textSrc('inscriptions', 'etape1_titre')} value={t.etape1_titre}/></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="affil">
                    <div className="affil-eyebrow"><Editable plain src={textSrc('inscriptions', 'marche_eyebrow')} value={t.marche_eyebrow}/></div>
                    <h4><Editable plain src={textSrc('inscriptions', 'marche_titre')} value={t.marche_titre}/></h4>
                    <Editable src={textSrc('inscriptions', 'marche_texte')} value={t.marche_texte}/>
                  </div>
                  <div className="affil">
                    <div className="affil-eyebrow"><Editable plain src={textSrc('inscriptions', 'gym_eyebrow')} value={t.gym_eyebrow}/></div>
                    <h4><Editable plain src={textSrc('inscriptions', 'gym_titre')} value={t.gym_titre}/></h4>
                    <Editable src={textSrc('inscriptions', 'gym_texte')} value={t.gym_texte}/>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "32px 36px" }}>
                <div className="page-header-eyebrow" style={{ color: "var(--accent)", marginBottom: 16 }}><Editable plain src={textSrc('inscriptions', 'etape2_titre')} value={t.etape2_titre}/></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ padding: "18px 20px", background: "var(--green-tint)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong><Editable plain src={textSrc('inscriptions', 'cb_titre')} value={t.cb_titre}/></strong>
                      <Editable src={textSrc('inscriptions', 'cb_texte')} value={t.cb_texte} style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}/>
                    </div>
                    <a
                      href={paymentLinks[0]?.url ?? 'https://www.helloasso.com/associations/association-gym-marche-rambouillet/adhesions/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-green btn-sm"
                    >
                      {paymentLinks[0]?.title ?? 'HelloAsso'} →
                    </a>
                  </div>
                  <ExternalLinksPanel links={paymentLinks.slice(1)} title={<Editable plain src={textSrc('inscriptions', 'autres_titre')} value={t.autres_titre}/>} compact/>
                  <div style={{ padding: "18px 20px", background: "var(--bg-elev)", borderRadius: "var(--r-md)" }}>
                    <strong><Editable plain src={textSrc('inscriptions', 'virement_titre')} value={t.virement_titre}/></strong>
                    <Editable src={textSrc('inscriptions', 'virement_texte')} value={t.virement_texte} style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}/>
                  </div>
                  <div style={{ padding: "18px 20px", background: "var(--bg-elev)", borderRadius: "var(--r-md)" }}>
                    <strong><Editable plain src={textSrc('inscriptions', 'papier_titre')} value={t.papier_titre}/></strong>
                    <Editable src={textSrc('inscriptions', 'papier_texte')} value={t.papier_texte} style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}/>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--accent-tint)", border: "1px solid var(--accent-soft)", borderRadius: "var(--r-md)", padding: "28px 32px" }}>
                <h3 style={{ marginBottom: 16 }}><Editable plain src={textSrc('inscriptions', 'debut_titre')} value={t.debut_titre}/></h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[["Gym", "debut_gym"],["Rando", "debut_rando"],["Nordique", "debut_nordique"]].map(([a,k]) => (
                    <div key={a} style={{ padding: "14px 16px", background: "rgba(255,255,255,.6)", borderRadius: "var(--r-sm)" }}>
                      <strong style={{ display: "block" }}>{a}</strong><Editable plain src={textSrc('inscriptions', k)} value={t[k]}/>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/inscriptions/tarifs">Voir les tarifs</Link>
              <Link className="btn btn-ghost" href="/contact">Poser une question</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
