export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import { getTarifs } from '@/lib/queries'

export const metadata = { title: 'Tarifs — AGMR' }

const CAT_LABELS = { gym: 'Tarifs Gym', marche: 'Tarifs Marche & Nordique' }

export default async function TarifsPage() {
  const rows = await getTarifs()

  // Grouper par catégorie (exclure les lignes méta internes)
  const grouped = rows
    .filter(r => r.categorie !== '__meta__')
    .reduce((acc, r) => {
      if (!acc[r.categorie]) acc[r.categorie] = []
      acc[r.categorie].push(r)
      return acc
    }, {})

  // Note globale optionnelle
  const noteGlobale = rows.find(r => r.label === '__note_globale__')?.note ?? null

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Inscriptions / Tarifs</div>
            <div className="page-header-eyebrow">Inscriptions · Saison 2025-2026</div>
            <h1>Tarifs</h1>
            <p className="page-header-lede">L'inscription se compose de l'adhésion à l'association, de la licence fédérale et de la cotisation d'activité.</p>
          </div>
        </div>

        <section className="section">
          <div className="container-narrow">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {Object.entries(grouped).map(([cat, lignes]) => (
                <div key={cat} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                  <div style={{ background: "var(--green)", color: "#fff", padding: "20px 24px" }}>
                    <h3 style={{ color: "#fff", fontFamily: "var(--sans)", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                      {CAT_LABELS[cat] ?? cat}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.88rem", opacity: 0.8 }}>Saison 2025-2026</p>
                  </div>
                  <table className="tbl" style={{ border: "none" }}>
                    <tbody>
                      {lignes.map(({ id, label, valeur, note }) => (
                        <tr key={id}>
                          <td>
                            {label}
                            {note && <div style={{ fontSize: "0.78rem", color: "var(--ink-mute)", marginTop: 2 }}>{note}</div>}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: valeur ? 600 : 400, color: valeur ? "var(--ink)" : "var(--ink-mute)", whiteSpace: "nowrap" }}>
                            {valeur || "à confirmer"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {noteGlobale && (
              <div style={{ marginTop: 24, padding: "16px 20px", background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", fontSize: "0.94rem", color: "var(--ink-soft)" }}>
                {noteGlobale}
              </div>
            )}

            <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
              <Link className="btn btn-primary" href="/inscriptions">S'inscrire</Link>
              <Link className="btn btn-ghost" href="/contact">Nous contacter</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
