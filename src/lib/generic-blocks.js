export const GENERIC_BLOCKS = [
  { type: 'texte',    label: 'Bloc texte libre',       desc: 'Titre et paragraphe éditable librement' },
  { type: 'citation', label: 'Témoignage / Citation',   desc: 'Citation, auteur et rôle' },
  { type: 'cta',      label: "Appel à l'action",        desc: 'Titre, texte court et bouton avec lien' },
  { type: 'alerte',   label: "Encadré d'information",   desc: 'Message important mis en valeur' },
]

// Retourne le type générique d'une clé (ex: 'texte_1234' → 'texte', 'header' → null)
export function genericType(block_key) {
  for (const g of GENERIC_BLOCKS) {
    if (block_key === g.type || block_key.startsWith(g.type + '_')) return g.type
  }
  return null
}
