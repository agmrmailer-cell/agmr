// Détecte si une valeur contient du HTML (éditeur WYSIWYG) ou du texte brut (ancien contenu)
export function isHtml(value) {
  return typeof value === 'string' && /<\/?[a-z][\s\S]*?>/i.test(value)
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Convertit un texte brut en HTML (paragraphes + retours à la ligne)
export function plainTextToHtml(text) {
  if (!text) return ''
  if (isHtml(text)) return text
  return text
    .split(/\n{2,}/)
    .map(par => `<p>${escapeHtml(par).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

// Si le HTML n'est qu'un seul paragraphe, renvoie son contenu interne (pour garder la mise en page d'origine)
export function unwrapSingleParagraph(html) {
  const match = html.match(/^<p>([\s\S]*)<\/p>$/)
  if (match && !/<\/?(p|ul|ol|h[2-4]|blockquote)\b/i.test(match[1])) return match[1]
  return null
}

// Aplatit le HTML en contenu inline (paragraphes séparés par des <br>)
export function toInlineHtml(html) {
  return html
    .replace(/<\/(p|h[2-4]|li|blockquote)>\s*<(p|h[2-4]|li|blockquote|ul|ol)[^>]*>/gi, '<br>')
    .replace(/<\/?(p|h[2-4]|ul|ol|li|blockquote)[^>]*>/gi, '')
}

// Texte brut (pour les aperçus dans l'admin)
export function richTextToPlain(value) {
  if (!value) return ''
  if (!isHtml(value)) return value
  return value
    .replace(/<\/(p|h[2-4]|li|blockquote)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
