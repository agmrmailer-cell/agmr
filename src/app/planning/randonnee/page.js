export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PageHeader from '@/components/shell/PageHeader'
import PlanningRandoClient from './PlanningRandoClient'
import Editable from '@/components/editable/Editable'
import { textSrc } from '@/lib/editable-src'
import { getSiteTexts } from '@/lib/queries'

export const metadata = { title: 'Planning Rando & Nordique — AGMR' }

export default async function PlanningRandoPage() {
  const t = await getSiteTexts('planning-rando')
  const plain = key => <Editable plain src={textSrc('planning-rando', key)} value={t[key]}/>

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t} page="planning-rando"/>
        <PlanningRandoClient
          title={plain('liens_titre')}
          intro={<Editable src={textSrc('planning-rando', 'liens_intro')} value={t.liens_intro} style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--ink-mute)' }}/>}
          loginTitle={plain('login_titre')}
          loginText={<Editable src={textSrc('planning-rando', 'login_texte')} value={t.login_texte} style={{ color: 'var(--ink-soft)', margin: 0 }}/>}
          emptyText={<Editable src={textSrc('planning-rando', 'vide')} value={t.vide} style={{ margin: 0 }}/>}
        />
      </main>
      <Footer/>
    </div>
  )
}
