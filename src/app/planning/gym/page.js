export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PlanningGymClient from './PlanningGymClient'
import { getGymCourses, getVacances, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'

export const metadata = { title: 'Planning Gym — AGMR' }

export default async function PlanningGymPage() {
  const [courses, vacances, t] = await Promise.all([getGymCourses(), getVacances(), getSiteTexts('planning-gym')])
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t}/>
        <PlanningGymClient courses={courses} vacances={vacances}/>
      </main>
      <Footer/>
    </div>
  )
}
