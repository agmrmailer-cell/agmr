import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ContactClient from './ContactClient'

export const metadata = { title: 'Contact — AGMR' }

export default function ContactPage() {
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Contact</div>
            <div className="page-header-eyebrow">Nous écrire</div>
            <h1>Contact</h1>
            <p className="page-header-lede">Une question sur nos activités, les inscriptions ou les horaires ? On vous répond rapidement.</p>
          </div>
        </div>
        <ContactClient/>
      </main>
      <Footer/>
    </div>
  )
}
