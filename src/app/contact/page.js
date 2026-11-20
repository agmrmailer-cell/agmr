import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import ContactClient from './ContactClient'
import PageHeader from '@/components/shell/PageHeader'
import { getSiteTexts } from '@/lib/queries'
import Editable from '@/components/editable/Editable'
import { textSrc } from '@/lib/editable-src'

export const metadata = { title: 'Contact — AGMR' }

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const t = await getSiteTexts('contact')
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t} page="contact"/>
        <ContactClient
          email={t.email}
          emailLabel={<Editable plain src={textSrc('contact', 'email')} value={t.email}/>}
          adresse={<Editable src={textSrc('contact', 'adresse')} value={t.adresse} as="span" style={{ color: "var(--ink-soft)" }}/>}
          forumTitre={<Editable plain src={textSrc('contact', 'forum_titre')} value={t.forum_titre}/>}
          forumTexte={<Editable src={textSrc('contact', 'forum_texte')} value={t.forum_texte} style={{ margin: 0, fontSize: "0.94rem", color: "var(--ink-soft)" }}/>}
          essaiTitre={<Editable plain src={textSrc('contact', 'essai_titre')} value={t.essai_titre}/>}
          essaiTexte={<Editable src={textSrc('contact', 'essai_texte')} value={t.essai_texte} style={{ margin: 0, fontSize: "0.94rem", color: "var(--ink-soft)" }}/>}
        />
      </main>
      <Footer/>
    </div>
  )
}
