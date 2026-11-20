import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import EspaceAdherentsClient from './EspaceAdherentsClient'
import RichText from '@/components/ui/RichText'
import { getSiteTexts } from '@/lib/queries'

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
          t={t}
          loginTexte={<RichText value={t.login_texte} style={{ color: 'var(--ink-mute)', marginBottom: 24, fontSize: '0.96rem' }}/>}
          liensIntro={<RichText value={t.liens_intro} style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--ink-mute)' }}/>}
          vide={<RichText value={t.vide} style={{ margin: 0 }}/>}
        />
      </main>
      <Footer/>
    </div>
  )
}
