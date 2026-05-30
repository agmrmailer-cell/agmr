export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import { getSejours } from '@/lib/queries'

export const metadata = { title: 'Séjours & Sorties — AGMR' }

const IMG_STYLES = {
  a: "linear-gradient(135deg, #c4956a 0%, #8b5e3c 100%)",
  b: "linear-gradient(135deg, #6aadbc 0%, #3a7d8c 100%)",
  c: "linear-gradient(135deg, #c4a96a 0%, #8b7040 100%)",
}

const SORTIES_JOURNEE = [
  { date: "21 juin 2026", sortie: "Auvers-sur-Oise — sur les pas de Van Gogh", transport: "Train" },
  { date: "05 juillet 2026", sortie: "Forêt de Fontainebleau — circuit des Trois Pignons", transport: "Covoiturage" },
]

export default async function SejoursPage() {
  const sejours = await getSejours()
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Actualités / Séjours & sorties</div>
            <div className="page-header-eyebrow">Actualités · Séjours & Sorties à la journée</div>
            <h1>Partir plus loin, ensemble</h1>
            <p className="page-header-lede">Chaque année, l'AGMR organise plusieurs séjours et sorties à la journée pour ses adhérents. En car, en train, en covoiturage.</p>
          </div>
        </div>

        <section className="section">
          <div className="container">
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "2rem", marginBottom: 28 }}>Saison 2025-2026</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 64 }}>
              {sejours.map(s => (
                <div key={s.id} className="sejour-page-card">
                  <div className="sejour-page-img" style={{
                    background: IMG_STYLES[s.img] || IMG_STYLES.a,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    ...(s.image_url ? { backgroundImage: `url(${s.image_url})` } : {}),
                  }}/>
                  <div className="sejour-page-body">
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
                      {s.transport}
                    </div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", fontWeight: 500, marginBottom: 8 }}>{s.titre}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", color: "var(--ink-mute)", marginBottom: 10 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {s.dates}
                    </div>
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.94rem", margin: 0 }}>{s.description}</p>
                  </div>
                  <div className="sejour-page-status">
                    {s.statut === "ouvert" && <>
                      <span className="badge badge-ok" style={{ fontSize: "0.68rem", letterSpacing: "0.1em" }}>Inscriptions ouvertes</span>
                      <Link className="btn btn-primary btn-sm" href="/inscriptions">S'inscrire</Link>
                    </>}
                    {s.statut === "complet" && <span className="badge badge-full">Complet</span>}
                    {s.statut === "passe" && <span className="badge" style={{ background: "var(--bg-deep)", color: "var(--ink-mute)" }}>Terminé</span>}
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ fontFamily: "var(--serif)", fontSize: "2rem", marginBottom: 8 }}>Sorties à la journée</h2>
            <p style={{ color: "var(--ink-mute)", fontSize: "0.94rem", marginBottom: 20 }}>À thème, plusieurs fois par trimestre. En train, en car ou en covoiturage.</p>
            <table className="tbl">
              <thead>
                <tr><th>Date</th><th>Sortie</th><th>Transport</th><th></th></tr>
              </thead>
              <tbody>
                {SORTIES_JOURNEE.map((s, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>{s.date}</td>
                    <td>{s.sortie}</td>
                    <td>{s.transport}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link className="btn btn-primary btn-sm" href="/inscriptions">S'inscrire</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
