import Link from 'next/link'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'

export const metadata = { title: "S'inscrire — AGMR" }

export default function InscriptionsPage() {
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Inscriptions</div>
            <div className="page-header-eyebrow">Rejoindre l'AGMR</div>
            <h1>Comment s'inscrire</h1>
            <p className="page-header-lede">Nous sommes heureux de bientôt vous compter parmi nos adhérents.</p>
          </div>
        </div>

        <section className="section">
          <div className="container-narrow">
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "32px 36px" }}>
                <div className="page-header-eyebrow" style={{ color: "var(--accent)", marginBottom: 16 }}>Étape 1 — Choisissez votre activité</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="affil">
                    <div className="affil-eyebrow">La Marche</div>
                    <h4>Licence FFRP obligatoire</h4>
                    <p>Randonnée pédestre, marche nordique et Rando-Santé. Couvre toutes les activités pendant la saison.</p>
                  </div>
                  <div className="affil">
                    <div className="affil-eyebrow">La Gym</div>
                    <h4>Licence FFEPGV obligatoire</h4>
                    <p>Gym douce ou dynamique, Yoga, Qi Gong, Pilates. Une seule adhésion pour gym et/ou marche.</p>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "32px 36px" }}>
                <div className="page-header-eyebrow" style={{ color: "var(--accent)", marginBottom: 16 }}>Étape 2 — Méthodes d'inscription</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ padding: "18px 20px", background: "var(--green-tint)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>Par carte bancaire (recommandé)</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}>Via HelloAsso — sécurisé, immédiat, sans frais</p>
                    </div>
                    <a href="https://www.helloasso.com/associations/association-gym-marche-rambouillet/adhesions/" target="_blank" rel="noopener" className="btn btn-green btn-sm">HelloAsso →</a>
                  </div>
                  <div style={{ padding: "18px 20px", background: "var(--bg-elev)", borderRadius: "var(--r-md)" }}>
                    <strong>Par virement ou chèque</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}>Via formulaire en ligne — IBAN et coordonnées dans le formulaire.</p>
                  </div>
                  <div style={{ padding: "18px 20px", background: "var(--bg-elev)", borderRadius: "var(--r-md)" }}>
                    <strong>Sans moyen informatique</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "0.92rem", color: "var(--ink-soft)" }}>Formulaire papier disponible auprès d'un membre de l'équipe AGMR.</p>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--accent-tint)", border: "1px solid var(--accent-soft)", borderRadius: "var(--r-md)", padding: "28px 32px" }}>
                <h3 style={{ marginBottom: 16 }}>Début des activités — saison 2025/2026</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[["Gym","Lundi 8 septembre"],["Rando","Jeudi 18 septembre"],["Nordique","Mardi 23 septembre"]].map(([a,d]) => (
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
