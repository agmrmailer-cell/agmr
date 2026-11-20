import { isHtml, toInlineHtml, unwrapSingleParagraph } from '@/lib/rich-text'
import { sanitizeRichText } from '@/lib/rich-text-sanitize'

// Affiche un contenu saisi dans l'éditeur WYSIWYG (HTML) ou un ancien texte brut.
// - `as` : élément utilisé quand le contenu tient en un seul paragraphe (ou en texte brut)
// - `inline` : aplatit le contenu pour l'insérer dans une phrase (span)
export default function RichText({ value, fallback, as: Tag = 'p', className, style, inline = false }) {
  const raw = value ?? fallback
  if (raw === null || raw === undefined || raw === '') return null

  if (!isHtml(raw)) {
    if (inline) return <span className={className} style={style}>{raw}</span>
    return <Tag className={className} style={style}>{raw}</Tag>
  }

  const html = sanitizeRichText(raw)
  if (!html) return null

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
