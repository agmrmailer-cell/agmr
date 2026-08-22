export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PlanningRandoClient from './PlanningRandoClient'
import { getExternalLinks, getPlanningRandoPageContent } from '@/lib/queries'

export const metadata = { title: 'Planning Rando & Nordique — AGMR' }

export default async function PlanningRandoPage() {
  const [links, pageContent] = await Promise.all([
    getExternalLinks('planning-rando'),
    getPlanningRandoPageContent(),
  ])
  const header = pageContent.header

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">{header.crumb}</div>
            <div className="page-header-eyebrow">{header.eyebrow}</div>
            <h1>{header.title}</h1>
            <p className="page-header-lede">{header.lede}</p>
          </div>
        </div>
        <PlanningRandoClient sorties={[]} links={links} linkContent={pageContent.links}/>
      </main>
      <Footer/>
    </div>
  )
}
