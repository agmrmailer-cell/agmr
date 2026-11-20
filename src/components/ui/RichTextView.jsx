import { isHtml, toInlineHtml, unwrapSingleParagraph } from '@/lib/rich-text'

// Affiche un contenu riche DÉJÀ NETTOYÉ (côté serveur) ou un texte brut.
// Utilisable dans les composants client. Côté serveur, préférer <RichText> qui nettoie le HTML.
// - `as` : élément utilisé quand le contenu tient en un seul paragraphe (ou en texte brut)
// - `inline` : aplatit le contenu pour l'insérer dans une phrase (span)
export default function RichTextView({ html, as: Tag = 'p', className, style, inline = false }) {
  if (html === null || html === undefined || html === '') return null

  if (!isHtml(html)) {
    if (inline) return <span className={className} style={style}>{html}</span>
    return <Tag className={className} style={style}>{html}</Tag>
  }

  if (inline) {
    return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: toInlineHtml(html) }}/>
  }

  const single = unwrapSingleParagraph(html)
  if (single !== null) {
    return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: single }}/>
  }

  return (
    <div
      className={['rich-text', className].filter(Boolean).join(' ')}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
