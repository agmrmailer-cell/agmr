export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import Icon from '@/components/ui/Icon'
import { getAGDocuments } from '@/lib/queries'

export const metadata = { title: 'Assemblée Générale — AGMR' }

export default async function AGPage() {
  const docs = await getAGDocuments()

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
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / L'association / Assemblée générale</div>
            <div className="page-header-eyebrow">L'association · Documents officiels</div>
            <h1>Assemblée Générale</h1>
            <p className="page-header-lede">L'Assemblée Générale se réunit une fois par an. Les membres du comité directeur sont élus lors de cette réunion.</p>
          </div>
        </div>

        <section className="section">
          <div className="container-narrow">
            {saisons.length === 0 ? (
              <p style={{ color: "var(--ink-mute)" }}>Aucun document disponible pour l'instant.</p>
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
