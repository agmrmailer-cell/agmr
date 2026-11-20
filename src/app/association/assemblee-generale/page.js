export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import Icon from '@/components/ui/Icon'
import { getAGDocuments, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'
import RichText from '@/components/ui/RichText'

export const metadata = { title: 'Assemblée Générale — AGMR' }

export default async function AGPage() {
  const [docs, t] = await Promise.all([getAGDocuments(), getSiteTexts('ag')])

  // Group by saison
  const bySaison = docs.reduce((acc, d) => {
    if (!acc[d.saison]) acc[d.saison] = []
    acc[d.saison].push(d)
    return acc
  }, {})
  const saisons = Object.keys(bySaison) // already sorted desc by query

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t}/>

        <section className="section">
          <div className="container-narrow">
            {saisons.length === 0 ? (
              <RichText value={t.vide} style={{ color: "var(--ink-mute)" }}/>
            ) : (
              saisons.map(saison => (
                <div key={saison} style={{ marginBottom: 40 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: "0.84rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 16 }}>
                    Saison {saison}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {bySaison[saison].map(doc => (
                      <a key={doc.id} href={doc.url ?? '#'} className="btn btn-ghost" style={{ justifyContent: "flex-start", textDecoration: "none" }}>
                        <Icon name="file" size={14}/> {doc.titre}
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
