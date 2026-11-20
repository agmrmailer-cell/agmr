import RichText from '@/components/ui/RichText'

// En-tête standard d'une page publique, alimenté par les textes éditables (crumb, eyebrow, title, lede)
export default function PageHeader({ t, children }) {
  return (
    <div className="page-header">
      <div className="container">
        {t.crumb && <div className="crumb">{t.crumb}</div>}
        {t.eyebrow && <div className="page-header-eyebrow">{t.eyebrow}</div>}
        <h1>{t.title}</h1>
        <RichText value={t.lede} className="page-header-lede"/>
        {children}
      </div>
    </div>
  )
}
