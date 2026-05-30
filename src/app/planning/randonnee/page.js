export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PlanningRandoClient from './PlanningRandoClient'
import { getRandoSorties } from '@/lib/queries'

export const metadata = { title: 'Planning Rando & Nordique — AGMR' }

export default async function PlanningRandoPage() {
  const sorties = await getRandoSorties()
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Planning / Rando & Nordique</div>
            <div className="page-header-eyebrow">Planning · Saison 2025-2026</div>
            <h1>Planning Rando & Nordique</h1>
            <p className="page-header-lede">Calendrier des sorties randonnée et des séances de marche nordique.</p>
          </div>
        </div>
        <PlanningRandoClient sorties={sorties}/>
      </main>
      <Footer/>
    </div>
  )
}
