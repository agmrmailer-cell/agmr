// Adresse par section du back-office : /admin?section=tarifs, /admin?section=pages (groupes)…
// Module partagé entre la page serveur et l'application client.
const HUB_SLUGS = new Set(['pages', 'plannings', 'actualites', 'association', 'reglages'])

export const toSlug = id => (id.startsWith('hub:') ? id.slice(4) : id)

export const sectionFromSlug = slug => (!slug ? 'dash' : HUB_SLUGS.has(slug) ? `hub:${slug}` : slug)

export const sectionUrl = id => (id === 'dash' ? '/admin' : `/admin?section=${encodeURIComponent(toSlug(id))}`)
