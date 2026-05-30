import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import AGMRLogo from '@/components/ui/AGMRLogo'
import Icon from '@/components/ui/Icon'

export const metadata = { title: "Espace Adhérents — AGMR" }

export default function EspacePage() {
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="login-shell">
          <div className="login-card">
            <AGMRLogo size={52}/>
            <div style={{ fontSize: "0.74rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 6, fontWeight: 600, marginTop: 24 }}>
              Espace adhérents
            </div>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Accès réservé</h2>
            <p style={{ color: "var(--ink-mute)", marginBottom: 24, fontSize: "0.96rem" }}>
              Mot de passe communiqué lors de l'inscription.
            </p>
            <div className="form">
              <div className="field">
                <label>Mot de passe</label>
                <input type="password" placeholder="••••••••"/>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 8 }}>
                <Icon name="lock" size={15}/> Accéder
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer/>
    </div>
  )
}
