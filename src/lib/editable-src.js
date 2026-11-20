// Descripteurs d'emplacement pour l'édition visuelle : où enregistrer un texte modifié sur le site.

// Texte de la table site_texts (clé "<page>.<champ>")
export const textSrc = (page, field) => ({ kind: 'text', key: `${page}.${field}` })

// Champ du JSON `content` d'un bloc de page (field peut être un chemin : "cards.0.texte")
export const blockSrc = (table, blockKey, field) => ({ kind: 'block', table, blockKey, field })

// Colonne d'une ligne de table (actualités, séjours, disciplines…)
export const rowSrc = (table, id, field) => ({ kind: 'row', table, id, field })
