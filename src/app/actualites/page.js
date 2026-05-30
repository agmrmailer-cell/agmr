export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ActualitesClient from './ActualitesClient'
import { getActualites } from '@/lib/queries'

export const metadata = { title: 'Actualités — AGMR' }

export default async function ActualitesPage() {
  const articles = await getActualites()
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Actualités</div>
            <div className="page-header-eyebrow">Annonces & Informations</div>
            <h1>Actualités</h1>
            <p className="page-header-lede">Toutes les annonces en cours, classées par section.</p>
          </div>
        </div>
        <ActualitesClient articles={articles}/>
      </main>
      <Footer/>
    </div>
  )
}
