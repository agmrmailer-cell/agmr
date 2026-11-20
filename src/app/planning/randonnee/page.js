export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PlanningRandoClient from './PlanningRandoClient'
import { getExternalLinks, getPlanningRandoPageContent } from '@/lib/queries'
import Editable from '@/components/editable/Editable'
import { blockSrc } from '@/lib/editable-src'

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
            <div className="crumb"><Editable plain src={blockSrc('planning_rando_page_blocks', 'header', 'crumb')} value={header.crumb}/></div>
            <div className="page-header-eyebrow"><Editable plain src={blockSrc('planning_rando_page_blocks', 'header', 'eyebrow')} value={header.eyebrow}/></div>
            <h1><Editable plain src={blockSrc('planning_rando_page_blocks', 'header', 'title')} value={header.title}/></h1>
            <Editable src={blockSrc('planning_rando_page_blocks', 'header', 'lede')} value={header.lede} className="page-header-lede"/>
          </div>
        </div>
        <PlanningRandoClient
          sorties={[]}
          links={links}
          linkContent={{
            ...pageContent.links,
            intro: (
              <Editable
                src={blockSrc('planning_rando_page_blocks', 'links', 'intro')}
                value={pageContent.links?.intro}
                fallback="Calendriers, documents et ressources externes pour la saison en cours."
                style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--ink-mute)' }}
              />
            ),
          }}
        />
      </main>
      <Footer/>
    </div>
  )
}
