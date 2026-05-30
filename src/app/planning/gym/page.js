export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PlanningGymClient from './PlanningGymClient'
import { getGymCourses, getVacances } from '@/lib/queries'

export const metadata = { title: 'Planning Gym — AGMR' }

export default async function PlanningGymPage() {
  const [courses, vacances] = await Promise.all([getGymCourses(), getVacances()])
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Planning / Gym</div>
            <div className="page-header-eyebrow">Planning · Saison 2025-2026</div>
            <h1>Planning de la Gym</h1>
            <p className="page-header-lede">43 heures de cours par semaine dans 5 salles. Pas de cours pendant les vacances scolaires.</p>
          </div>
        </div>
        <PlanningGymClient courses={courses} vacances={vacances}/>
      </main>
      <Footer/>
    </div>
  )
}
