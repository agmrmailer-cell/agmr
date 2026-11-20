import RichText from '@/components/ui/RichText'
import { getEditMode } from '@/lib/edit-mode'
import { isHtml } from '@/lib/rich-text'
import { sanitizeRichText } from '@/lib/rich-text-sanitize'
import EditableField from './EditableField'

// Texte du site modifiable « sur place » par un administrateur en mode édition visuelle.
// Pour les visiteurs, le rendu est strictement identique à <RichText> (ou au texte brut si `plain`).
//
// - src      : emplacement d'enregistrement (textSrc / blockSrc / rowSrc)
// - plain    : texte simple sans mise en forme (titres, libellés) — rendu sans balise englobante
// - as, className, style, inline : comme <RichText>
// - label    : nom affiché à l'administrateur
export default async function Editable({ src, value, fallback, plain = false, as = 'p', inline = false, simple = false, className, style, label }) {
  const raw = value ?? fallback ?? ''
  const editMode = src ? await getEditMode() : false

  if (!editMode) {
    if (plain) return raw === '' ? null : raw
    return <RichText value={raw} as={as} inline={inline} className={className} style={style}/>
  }

  const html = plain ? String(raw) : (isHtml(raw) ? sanitizeRichText(raw) : raw)
  return (
    <EditableField
      src={src}
      html={html}
      plain={plain}
      as={as}
      inline={inline}
      simple={simple}
      className={className}
      style={style}
      label={label}
    />
  )
}
