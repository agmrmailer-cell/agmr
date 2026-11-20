export const dynamic = 'force-dynamic'
import Header from '@/components/shell/Header'
import Banner from '@/components/shell/Banner'
import Footer from '@/components/shell/Footer'
import { getBureau, getGymAnimateurs, getSiteTexts } from '@/lib/queries'
import PageHeader from '@/components/shell/PageHeader'

export const metadata = { title: 'Comité Directeur — AGMR' }

export default async function ComitePage() {
  const [bureau, animateurs, t] = await Promise.all([getBureau(), getGymAnimateurs(), getSiteTexts('comite')])

  return (
    <div className="page-shell">
      <Banner/>
      <Header/>
      <main className="page-main">
        <PageHeader t={t}/>

        <section className="section">
          <div className="container">

            {/* Groupement par catégorie */}
            {(() => {
              const groups = bureau.reduce((acc, b) => {
                const g = b.groupe ?? 'Membres du bureau'
                if (!acc[g]) acc[g] = []
                acc[g].push(b)
                return acc
              }, {})
              const ORDER = ['Bureau exécutif', 'Responsables d\'activités', 'Membres du bureau']
              const sorted = ORDER.filter(g => groups[g]).concat(Object.keys(groups).filter(g => !ORDER.includes(g)))
              return sorted.map((groupe, gi) => (
                <div key={groupe} style={{ marginBottom: gi < sorted.length - 1 ? 56 : 0 }}>
                  <h2 style={{ fontSize: "1.6rem", marginBottom: 24 }}>{groupe}</h2>
                  <div className="team-grid">
                    {groups[groupe].map(b => (
                      <div key={b.id} className="team-card">
                        <div
                          className="team-photo"
                          style={b.photo_url ? { backgroundImage: `url(${b.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                        >
                          {!b.photo_url && <div className="team-photo-initial">{b.nom.charAt(0)}</div>}
                        </div>
                        <div className="team-body">
                          <div className="team-name">{b.nom}</div>
                          <div className="team-role">{b.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            })()}

            {animateurs.length > 0 && (
              <>
                <h2 style={{ fontSize: "2rem", marginBottom: 28 }}>{t.animateurs_titre}</h2>
                <div className="team-grid">
                  {animateurs.map(a => (
                    <div key={a.id} className="team-card">
                      <div
                        className="team-photo"
                        style={a.photo_url ? { backgroundImage: `url(${a.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                      >
                        {!a.photo_url && <div className="team-photo-initial">{a.nom?.charAt(0)?.toUpperCase() ?? '?'}</div>}
                      </div>
                      <div className="team-body">
                        <div className="team-name">{a.nom}</div>
                        <div className="team-role">{a.role}</div>
                        {a.disciplines && <div className="team-disc">{a.disciplines}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
