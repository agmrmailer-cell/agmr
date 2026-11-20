import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ContactClient from './ContactClient'
import PageHeader from '@/components/shell/PageHeader'
import RichText from '@/components/ui/RichText'
import { getSiteTexts } from '@/lib/queries'

export const metadata = { title: 'Contact — AGMR' }

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const t = await getSiteTexts('contact')
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t}/>
        <ContactClient
          email={t.email}
          adresse={<RichText value={t.adresse} as="span" style={{ color: "var(--ink-soft)" }}/>}
          forumTitre={t.forum_titre}
          forumTexte={<RichText value={t.forum_texte} style={{ margin: 0, fontSize: "0.94rem", color: "var(--ink-soft)" }}/>}
          essaiTitre={t.essai_titre}
          essaiTexte={<RichText value={t.essai_texte} style={{ margin: 0, fontSize: "0.94rem", color: "var(--ink-soft)" }}/>}
        />
      </main>
      <Footer/>
    </div>
  )
}
