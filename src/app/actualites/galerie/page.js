import Header from '@/components/shell/Header'
import Footer from '@/components/shell/Footer'
import { getGaleriePhotos } from '@/lib/queries'

export const metadata = { title: 'Galerie Photos — AGMR' }

const PATS = ["gallery-pat-1","gallery-pat-2","gallery-pat-3","gallery-pat-4","gallery-pat-5","gallery-pat-6"]

export default async function GaleriePage() {
  const photos = await getGaleriePhotos()

  const albumsMap = photos.reduce((acc, photo) => {
    if (!acc[photo.album]) acc[photo.album] = []
    acc[photo.album].push(photo)
    return acc
  }, {})

  const albums = Object.entries(albumsMap)

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
            {albums.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--ink-mute)", background: "var(--bg-elev)", borderRadius: "var(--r-md)", border: "2px dashed var(--line)" }}>
                <p>Aucune photo pour le moment. Les photos ajoutées depuis le backoffice apparaîtront ici.</p>
              </div>
            ) : (
              albums.map(([album, albumPhotos], ai) => (
                <div key={album} style={{ marginBottom: 56 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "1.3rem", marginBottom: 4 }}>{album}</h3>
                      <span style={{ fontSize: "0.86rem", color: "var(--ink-mute)" }}>{albumPhotos.length} photo{albumPhotos.length > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="gallery-grid">
                    {albumPhotos.map((photo, i) => (
                      <div key={photo.id} style={{ aspectRatio: "1/1", borderRadius: "var(--r-sm)", overflow: "hidden", position: "relative" }}>
                        <img
                          src={photo.url}
                          alt={photo.legende || album}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        {photo.legende && (
                          <div className="gallery-item-cap">{photo.legende}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
