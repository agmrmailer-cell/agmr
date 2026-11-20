import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import PageHeader from '@/components/shell/PageHeader'
import RichText from '@/components/ui/RichText'
import { getSiteTexts } from '@/lib/queries'

export const metadata = { title: "Mentions Légales — AGMR" }

export const dynamic = 'force-dynamic'

export default async function MentionsPage() {
  const t = await getSiteTexts('mentions-legales')
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t}/>

        <section className="section">
          <div className="container-narrow">
            <RichText value={t.contenu} className="legal-content" style={{ color: "var(--ink-soft)" }}/>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
