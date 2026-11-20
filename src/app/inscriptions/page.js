import Link from 'next/link'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ExternalLinksPanel from '@/components/links/ExternalLinksPanel'
import { getExternalLinks, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'
import RichText from '@/components/ui/RichText'

export const metadata = { title: "S'inscrire — AGMR" }

export default async function InscriptionsPage() {
  const [paymentLinks, t] = await Promise.all([getExternalLinks('inscriptions'), getSiteTexts('inscriptions')])

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t}/>

        <section className="section">
          <div className="container-narrow">
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "32px 36px" }}>
                <div className="page-header-eyebrow" style={{ color: "var(--accent)", marginBottom: 16 }}>{t.etape1_titre}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="affil">
                    <div className="affil-eyebrow">{t.marche_eyebrow}</div>
                    <h4>{t.marche_titre}</h4>
                    <RichText value={t.marche_texte}/>
                  </div>
                  <div className="affil">
                    <div className="affil-eyebrow">{t.gym_eyebrow}</div>
                    <h4>{t.gym_titre}</h4>
                    <RichText value={t.gym_texte}/>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "32px 36px" }}>
                <div className="page-header-eyebrow" style={{ color: "var(--accent)", marginBottom: 16 }}>{t.etape2_titre}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ padding: "18px 20px", background: "var(--green-tint)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{t.cb_titre}</strong>
                      <RichText value={t.cb_texte} style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}/>
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
                  <ExternalLinksPanel links={paymentLinks.slice(1)} title={t.autres_titre} compact/>
                  <div style={{ padding: "18px 20px", background: "var(--bg-elev)", borderRadius: "var(--r-md)" }}>
                    <strong>{t.virement_titre}</strong>
                    <RichText value={t.virement_texte} style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}/>
                  </div>
                  <div style={{ padding: "18px 20px", background: "var(--bg-elev)", borderRadius: "var(--r-md)" }}>
                    <strong>{t.papier_titre}</strong>
                    <RichText value={t.papier_texte} style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}/>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--accent-tint)", border: "1px solid var(--accent-soft)", borderRadius: "var(--r-md)", padding: "28px 32px" }}>
                <h3 style={{ marginBottom: 16 }}>{t.debut_titre}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[["Gym", t.debut_gym],["Rando", t.debut_rando],["Nordique", t.debut_nordique]].map(([a,d]) => (
                    <div key={a} style={{ padding: "14px 16px", background: "rgba(255,255,255,.6)", borderRadius: "var(--r-sm)" }}>
                      <strong style={{ display: "block" }}>{a}</strong>{d}
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
