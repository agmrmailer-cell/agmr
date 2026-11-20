export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import GalerieClient from './GalerieClient'
import { getGaleriePhotos, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'
import Editable from '@/components/editable/Editable'
import { textSrc } from '@/lib/editable-src'

export const metadata = { title: 'Galerie Photos — AGMR' }

export default async function GaleriePage() {
  const [photos, t] = await Promise.all([getGaleriePhotos(), getSiteTexts('galerie')])

  // Grouper par album (ordre d'insertion conservé)
  const albumsMap = photos.reduce((acc, photo) => {
    const key = photo.album || 'Sans album'
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t} page="galerie"/>
        <section className="section">
          <div className="container">
            <GalerieClient albumsMap={albumsMap}/>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
