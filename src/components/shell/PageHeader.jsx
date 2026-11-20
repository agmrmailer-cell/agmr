import Editable from '@/components/editable/Editable'
import { textSrc } from '@/lib/editable-src'

// En-tête standard d'une page publique, alimenté par les textes éditables (crumb, eyebrow, title, lede).
// `page` : identifiant de la page dans site_texts, pour l'édition visuelle sur le site.
export default function PageHeader({ t, page, children }) {
  const src = field => (page ? textSrc(page, field) : null)
  return (
    <div className="page-header">
      <div className="container">
        {t.crumb && <div className="crumb"><Editable plain src={src('crumb')} value={t.crumb} label="Fil d'Ariane"/></div>}
        {t.eyebrow && <div className="page-header-eyebrow"><Editable plain src={src('eyebrow')} value={t.eyebrow} label="Accroche"/></div>}
        <h1><Editable plain src={src('title')} value={t.title} label="Titre"/></h1>
        {t.lede !== undefined && <Editable src={src('lede')} value={t.lede} className="page-header-lede" label="Chapeau"/>}
        {children}
      </div>
    </div>
  )
}
