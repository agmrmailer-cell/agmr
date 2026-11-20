export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ActualitesClient from './ActualitesClient'
import { getActualites, getExternalLinks, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'
import Editable from '@/components/editable/Editable'
import { textSrc, rowSrc } from '@/lib/editable-src'

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
        <PageHeader t={t} page="actualites"/>
        <ActualitesClient
          articles={articles.map(n => ({
            ...n,
            titleNode: <Editable plain src={rowSrc('actualites', n.id, 'title')} value={n.title}/>,
            excerptNode: <Editable src={rowSrc('actualites', n.id, 'excerpt')} value={n.excerpt} style={{ color: "var(--ink-soft)", fontSize: "0.95rem", margin: 0 }}/>,
          }))}
          links={links}
        />
      </main>
      <Footer/>
    </div>
  )
}
