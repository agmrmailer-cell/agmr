import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PageHeader from '@/components/shell/PageHeader'
import { getSiteTexts } from '@/lib/queries'
import Editable from '@/components/editable/Editable'
import { textSrc } from '@/lib/editable-src'

export const metadata = { title: "Mentions Légales — AGMR" }

export const dynamic = 'force-dynamic'

export default async function MentionsPage() {
  const t = await getSiteTexts('mentions-legales')
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t} page="mentions-legales"/>

        <section className="section">
          <div className="container-narrow">
            <Editable src={textSrc('mentions-legales', 'contenu')} value={t.contenu} className="legal-content" style={{ color: "var(--ink-soft)" }}/>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
