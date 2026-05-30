import Link from 'next/link'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'

export const metadata = { title: "Mentions Légales — AGMR" }

export default function MentionsPage() {
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Mentions légales</div>
            <div className="page-header-eyebrow">Informations légales</div>
            <h1>Mentions légales</h1>
          </div>
        </div>

        <section className="section">
          <div className="container-narrow">

            <h2 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Éditeur du site</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              <strong>Association Gym Marche Rambouillet (AGMR)</strong><br/>
              50, rue du Muguet — 78120 Rambouillet<br/>
              <a href="mailto:contact@gymmarche.fr">contact@gymmarche.fr</a><br/>
              Association loi 1901 — créée en 1970<br/>
              SIRET : à compléter
            </p>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "36px 0" }}/>

            <h2 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Hébergement</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              <strong>Vercel Inc.</strong><br/>
              440 N Barranca Ave #4133<br/>
              Covina, CA 91723, USA<br/>
              <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a>
            </p>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "36px 0" }}/>

            <h2 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Données personnelles</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.
            </p>
            <p style={{ color: "var(--ink-soft)" }}>
              Pour exercer ce droit, contactez-nous à : <a href="mailto:contact@gymmarche.fr">contact@gymmarche.fr</a>
            </p>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "36px 0" }}/>

            <h2 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Cookies</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              Ce site n'utilise pas de cookies de traçage ou publicitaires. Des cookies techniques nécessaires au fonctionnement du site peuvent être déposés.
            </p>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "36px 0" }}/>

            <h2 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Propriété intellectuelle</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              L'ensemble du contenu de ce site (textes, images, logos) est la propriété de l'AGMR ou de ses partenaires. Toute reproduction est interdite sans autorisation préalable.
            </p>

          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
