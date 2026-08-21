import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import EspaceAdherentsClient from './EspaceAdherentsClient'

export const metadata = { title: "Espace Adhérents — AGMR" }

export default function EspacePage() {
  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <EspaceAdherentsClient/>
      </main>
      <Footer/>
    </div>
  )
}
