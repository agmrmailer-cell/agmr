export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PlanningRandoClient from './PlanningRandoClient'
import { getExternalLinks } from '@/lib/queries'

export const metadata = { title: 'Planning Rando & Nordique — AGMR' }

const FALLBACK_LINKS = [
  {
    id: 'fallback-rando',
    title: 'Planning rando',
    url: 'https://docs.google.com/spreadsheets/d/1HtnvxtFALYKxeitvtg9G2Jww_Zz0W0QwCJ1NUjZBL3w/',
    kind: 'planning',
    description: 'Calendrier complet des randonnees',
  },
  {
    id: 'fallback-nordique',
    title: 'Planning nordique',
    url: 'https://docs.google.com/spreadsheets/d/179on1ss96y0_AiGywGb-1uQFRFvPBOoYJ4tEA9UkPTE/',
    kind: 'planning',
    description: 'Calendrier complet de marche nordique',
  },
]

export default async function PlanningRandoPage() {
  const links = await getExternalLinks('planning-rando')
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
        <PlanningRandoClient sorties={[]} links={links.length > 0 ? links : FALLBACK_LINKS}/>
      </main>
      <Footer/>
    </div>
  )
}
