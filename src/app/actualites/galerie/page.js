export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Footer from '@/components/shell/Footer'
import GalerieClient from './GalerieClient'
import { getGaleriePhotos } from '@/lib/queries'

export const metadata = { title: 'Galerie Photos — AGMR' }

export default async function GaleriePage() {
  const photos = await getGaleriePhotos()

  // Grouper par album (ordre d'insertion conservé)
  const albumsMap = photos.reduce((acc, photo) => {
    const key = photo.album || 'Sans album'
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})

  return (
    <div className="page-shell">
      <Header/>
      <main className="page-main">
        <div className="page-header">
          <div className="container">
            <div className="crumb">Accueil / Actualités / Galerie</div>
            <div className="page-header-eyebrow">Actualités · Photos</div>
            <h1>Galerie photos</h1>
            <p className="page-header-lede">Albums photos des activités et événements de l'AGMR.</p>
          </div>
        </div>
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
