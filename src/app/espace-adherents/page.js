import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import EspaceAdherentsClient from './EspaceAdherentsClient'
import { getSiteTexts } from '@/lib/queries'
import Editable from '@/components/editable/Editable'
import { textSrc } from '@/lib/editable-src'

export const metadata = { title: "Espace Adhérents — AGMR" }

export const dynamic = 'force-dynamic'

export default async function EspacePage() {
  const t = await getSiteTexts('espace-adherents')
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <EspaceAdherentsClient
          t={Object.fromEntries(['eyebrow', 'res_titre', 'liens_titre', 'login_titre'].map(k => [k, <Editable key={k} plain src={textSrc('espace-adherents', k)} value={t[k]}/>]))}
          loginTexte={<Editable src={textSrc('espace-adherents', 'login_texte')} value={t.login_texte} style={{ color: 'var(--ink-mute)', marginBottom: 24, fontSize: '0.96rem' }}/>}
          liensIntro={<Editable src={textSrc('espace-adherents', 'liens_intro')} value={t.liens_intro} style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--ink-mute)' }}/>}
          vide={<Editable src={textSrc('espace-adherents', 'vide')} value={t.vide} style={{ margin: 0 }}/>}
        />
      </main>
      <Footer/>
    </div>
  )
}
