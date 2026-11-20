import { isHtml } from '@/lib/rich-text'
import { sanitizeRichText } from '@/lib/rich-text-sanitize'
import RichTextView from './RichTextView'

// Affiche un contenu saisi dans l'éditeur WYSIWYG (HTML nettoyé ici) ou un ancien texte brut.
// - `as` : élément utilisé quand le contenu tient en un seul paragraphe (ou en texte brut)
// - `inline` : aplatit le contenu pour l'insérer dans une phrase (span)
export default function RichText({ value, fallback, ...props }) {
  const raw = value ?? fallback
  if (raw === null || raw === undefined || raw === '') return null
  return <RichTextView html={isHtml(raw) ? sanitizeRichText(raw) : raw} {...props}/>
}
