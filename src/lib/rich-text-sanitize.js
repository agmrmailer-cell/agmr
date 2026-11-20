import sanitizeHtml from 'sanitize-html'

const SANITIZE_OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? ''
      const external = /^https?:\/\//i.test(href)
      return {
        tagName: 'a',
        attribs: external
          ? { href, target: '_blank', rel: 'noopener noreferrer' }
          : { href },
      }
    },
  },
}

export function sanitizeRichText(html) {
  return sanitizeHtml(html ?? '', SANITIZE_OPTIONS).trim()
}
