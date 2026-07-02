import Link from 'next/link'
import AGMRLogo from '@/components/ui/AGMRLogo'
import Icon from '@/components/ui/Icon'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <AGMRLogo size={44} light={true}/>
          <p className="footer-tag">
            Association loi 1901 fondee en 1970. Gym, randonnee et marche nordique
            a Rambouillet — en dehors de toute competition.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
            
              <a href="mailto:contact@gymmarche.fr"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Icon name="mail" size={15}/> contact@gymmarche.fr
            </a>
          </div>
        </div>

        <div>
          <h4>Activites</h4>
          <ul className="footer-list">
            <li><Link href="/activites/gym">Gymnastique</Link></li>
            <li><Link href="/activites/randonnee">Randonnee & Marche nordique</Link></li>
            <li><Link href="/activites/sante">Sante par le sport</Link></li>
            <li><Link href="/planning/gym">Planning gym</Link></li>
            <li><Link href="/planning/randonnee">Planning rando</Link></li>
          </ul>
        </div>

        <div>
          <h4>L'association</h4>
          <ul className="footer-list">
            <li><Link href="/association">Presentation</Link></li>
            <li><Link href="/association/comite-directeur">Comite directeur</Link></li>
            <li><Link href="/association/assemblee-generale">Assemblee generale</Link></li>
            <li><Link href="/inscriptions">S'inscrire</Link></li>
            <li><Link href="/inscriptions/tarifs">Tarifs</Link></li>
          </ul>
        </div>

        <div>
          <h4>Pratique</h4>
          <ul className="footer-list">
            <li><Link href="/contact">Contact</Link></li>

            <li><Link href="/admin">Administration</Link></li>
            <li><Link href="/mentions-legales">Mentions legales</Link></li>
          </ul>
          <div style={{ marginTop: 26 }}>
            <h4 style={{ fontSize: ".72rem", marginBottom: 12 }}>Affiliations</h4>
            <div className="partners-row">
              <span className="partner-chip">FFR</span>
              <span className="partner-chip">FFEPGV</span>
              <span className="partner-chip">CG 78</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>AGMR 2026 — 50 rue du Muguet, 78120 Rambouillet</span>
        <Link href="/mentions-legales">Mentions legales</Link>
      </div>
    </footer>
  )
}
