export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ActualitesClient from './ActualitesClient'
import { getActualites, getExternalLinks, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'

export const metadata = { title: 'Actualités — AGMR' }

export default async function ActualitesPage() {
  const [articles, links] = await Promise.all([
    getActualites(),
    getExternalLinks('actualites'),
  ])
  const t = await getSiteTexts('actualites')
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t}/>
        <ActualitesClient articles={articles} links={links}/>
      </main>
      <Footer/>
    </div>
  )
}
