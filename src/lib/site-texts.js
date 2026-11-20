// Registre des textes éditables du site (table Supabase `site_texts`, clé = "<page>.<champ>").
// type 'text' : champ simple (titres, libellés) · type 'rich' : éditeur WYSIWYG (HTML)

const header = ({ crumb, eyebrow, title, lede }) => [
  { key: 'crumb',   label: "Fil d'Ariane",    type: 'text', default: crumb },
  { key: 'eyebrow', label: 'Accroche',        type: 'text', default: eyebrow },
  { key: 'title',   label: 'Titre principal', type: 'text', default: title },
  ...(lede !== undefined ? [{ key: 'lede', label: 'Chapeau', type: 'rich', default: lede }] : []),
]

export const SITE_TEXT_PAGES = [
  {
    id: 'home',
    label: "Page d'accueil (titres de sections)",
    href: '/',
    fields: [
      { key: 'trio_eyebrow', label: 'Activités — accroche', type: 'text', default: 'Trois activites, un meme esprit' },
      { key: 'trio_titre',   label: 'Activités — titre',    type: 'text', default: 'Choisissez votre tempo.' },
      { key: 'trio_lede',    label: 'Activités — introduction', type: 'rich', default: '<p>Une adhésion unique donne accès à la gym et/ou à la marche. A vous de construire votre semaine.</p>' },
      { key: 'news_eyebrow', label: 'Actualités — accroche', type: 'text', default: 'À la une' },
      { key: 'news_titre',   label: 'Actualités — titre',    type: 'text', default: 'Dernières actualités' },
      { key: 'news_lien',    label: 'Actualités — bouton',   type: 'text', default: 'Toutes les actualités' },
    ],
  },
  {
    id: 'footer',
    label: 'Pied de page (toutes les pages)',
    href: '/',
    fields: [
      { key: 'tag',      label: 'Présentation',            type: 'rich', default: "<p>Association loi 1901 fondée en 1970. Gym, randonnée et marche nordique à Rambouillet — en dehors de toute compétition.</p>" },
      { key: 'email',    label: 'Email de contact',        type: 'text', default: 'contact@gymmarche.fr' },
      { key: 'bottom',   label: 'Ligne du bas (adresse)',  type: 'text', default: 'AGMR 2026 — 50 rue du Muguet, 78120 Rambouillet' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    href: '/contact',
    fields: [
      ...header({ crumb: 'Accueil / Contact', eyebrow: 'Nous écrire', title: 'Contact', lede: '<p>Une question sur nos activités, les inscriptions ou les horaires ? On vous répond rapidement.</p>' }),
      { key: 'email',        label: 'Email affiché',               type: 'text', default: 'contact@gymmarche.fr' },
      { key: 'adresse',      label: 'Adresse (boîte aux lettres)', type: 'rich', default: '<p>50, rue du Muguet<br>78120 Rambouillet</p>' },
      { key: 'forum_titre',  label: 'Encadré 1 — titre',           type: 'text', default: 'Forum des Associations' },
      { key: 'forum_texte',  label: 'Encadré 1 — texte',           type: 'rich', default: '<p>Samedi 13 septembre au stade du Vieux Moulin. Venez nous rencontrer sur le stand AGMR.</p>' },
      { key: 'essai_titre',  label: 'Encadré 2 — titre',           type: 'text', default: 'Première séance gratuite' },
      { key: 'essai_texte',  label: 'Encadré 2 — texte',           type: 'rich', default: "<p>Vous pouvez assister à une séance d'essai gratuite sans inscription préalable pour la gym et la randonnée.</p>" },
    ],
  },
  {
    id: 'inscriptions',
    label: "S'inscrire",
    href: '/inscriptions',
    fields: [
      ...header({ crumb: 'Accueil / Inscriptions', eyebrow: "Rejoindre l'AGMR", title: "Comment s'inscrire", lede: '<p>Nous sommes heureux de bientôt vous compter parmi nos adhérents.</p>' }),
      { key: 'etape1_titre',    label: 'Étape 1 — titre',            type: 'text', default: 'Étape 1 — Choisissez votre activité' },
      { key: 'marche_eyebrow',  label: 'Carte Marche — accroche',    type: 'text', default: 'La Marche' },
      { key: 'marche_titre',    label: 'Carte Marche — titre',       type: 'text', default: 'Licence FFRP obligatoire' },
      { key: 'marche_texte',    label: 'Carte Marche — texte',       type: 'rich', default: '<p>Randonnée pédestre, marche nordique et Rando-Santé. Couvre toutes les activités pendant la saison.</p>' },
      { key: 'gym_eyebrow',     label: 'Carte Gym — accroche',       type: 'text', default: 'La Gym' },
      { key: 'gym_titre',       label: 'Carte Gym — titre',          type: 'text', default: 'Licence FFEPGV obligatoire' },
      { key: 'gym_texte',       label: 'Carte Gym — texte',          type: 'rich', default: '<p>Gym douce ou dynamique, Yoga, Qi Gong, Pilates. Une seule adhésion pour gym et/ou marche.</p>' },
      { key: 'etape2_titre',    label: 'Étape 2 — titre',            type: 'text', default: "Étape 2 — Méthodes d'inscription" },
      { key: 'cb_titre',        label: 'Carte bancaire — titre',     type: 'text', default: 'Par carte bancaire (recommandé)' },
      { key: 'cb_texte',        label: 'Carte bancaire — texte',     type: 'rich', default: '<p>Via HelloAsso — sécurisé, immédiat, sans frais</p>' },
      { key: 'autres_titre',    label: "Autres liens — titre",       type: 'text', default: "Autres liens d'inscription" },
      { key: 'virement_titre',  label: 'Virement/chèque — titre',    type: 'text', default: 'Par virement ou chèque' },
      { key: 'virement_texte',  label: 'Virement/chèque — texte',    type: 'rich', default: '<p>Via formulaire en ligne — IBAN et coordonnées dans le formulaire.</p>' },
      { key: 'papier_titre',    label: 'Sans informatique — titre',  type: 'text', default: 'Sans moyen informatique' },
      { key: 'papier_texte',    label: 'Sans informatique — texte',  type: 'rich', default: "<p>Formulaire papier disponible auprès d'un membre de l'équipe AGMR.</p>" },
      { key: 'debut_titre',     label: 'Début des activités — titre', type: 'text', default: 'Début des activités — saison 2025/2026' },
      { key: 'debut_gym',       label: 'Date de reprise Gym',        type: 'text', default: 'Lundi 8 septembre' },
      { key: 'debut_rando',     label: 'Date de reprise Rando',      type: 'text', default: 'Jeudi 18 septembre' },
      { key: 'debut_nordique',  label: 'Date de reprise Nordique',   type: 'text', default: 'Mardi 23 septembre' },
    ],
  },
  {
    id: 'planning-rando',
    label: 'Planning Rando (réservé aux adhérents)',
    href: '/planning/randonnee',
    fields: [
      ...header({ crumb: 'Accueil / Planning / Rando & Nordique', eyebrow: 'Planning · Saison 2025-2026', title: 'Planning Rando & Nordique', lede: '<p>Calendrier des sorties randonnée et des séances de marche nordique.</p>' }),
      { key: 'login_titre', label: 'Accès — titre',                type: 'text', default: 'Planning réservé aux adhérents' },
      { key: 'login_texte', label: 'Accès — texte',                type: 'rich', default: "<p>Pour des raisons de sécurité (vols sur les parkings de départ), le planning des sorties n'est visible qu'avec le mot de passe adhérents communiqué lors de l'inscription.</p>" },
      { key: 'liens_titre', label: 'Bloc des liens — titre',       type: 'text', default: 'Plannings complets en ligne' },
      { key: 'liens_intro', label: 'Bloc des liens — introduction', type: 'rich', default: '<p>Calendriers, documents et ressources externes pour la saison en cours.</p>' },
      { key: 'vide',        label: 'Message si aucun lien',         type: 'rich', default: "<p>Aucun planning n'est publié pour le moment.</p>" },
    ],
  },
  {
    id: 'actualites',
    label: 'Actualités',
    href: '/actualites',
    fields: header({ crumb: 'Accueil / Actualités', eyebrow: 'Annonces & Informations', title: 'Actualités', lede: '<p>Toutes les annonces en cours, classées par section.</p>' }),
  },
  {
    id: 'sejours',
    label: 'Séjours & sorties',
    href: '/actualites/sejours',
    fields: [
      ...header({ crumb: 'Accueil / Actualités / Séjours & sorties', eyebrow: 'Actualités · Séjours & Sorties à la journée', title: 'Partir plus loin, ensemble', lede: "<p>Chaque année, l'AGMR organise plusieurs séjours et sorties à la journée pour ses adhérents. En car, en train, en covoiturage.</p>" }),
      { key: 'saison_titre', label: 'Titre de la liste des séjours', type: 'text', default: 'Saison 2025-2026' },
    ],
  },
  {
    id: 'galerie',
    label: 'Galerie photos',
    href: '/actualites/galerie',
    fields: header({ crumb: 'Accueil / Actualités / Galerie', eyebrow: 'Actualités · Photos', title: 'Galerie photos', lede: "<p>Albums photos des activités et événements de l'AGMR.</p>" }),
  },
  {
    id: 'planning-gym',
    label: 'Planning Gym',
    href: '/planning/gym',
    fields: header({ crumb: 'Accueil / Planning / Gym', eyebrow: 'Planning · Saison 2025-2026', title: 'Planning de la Gym', lede: '<p>43 heures de cours par semaine dans 5 salles. Pas de cours pendant les vacances scolaires.</p>' }),
  },
  {
    id: 'comite',
    label: 'Comité directeur',
    href: '/association/comite-directeur',
    fields: [
      ...header({ crumb: "Accueil / L'association / Comité directeur", eyebrow: "L'association · Gouvernance", title: 'Comité directeur', lede: '<p>Élu en assemblée générale, le comité directeur se réunit 2 fois par trimestre.</p>' }),
      { key: 'animateurs_titre', label: 'Titre de la section animateurs', type: 'text', default: 'Les animateurs' },
    ],
  },
  {
    id: 'ag',
    label: 'Assemblée générale',
    href: '/association/assemblee-generale',
    fields: [
      ...header({ crumb: "Accueil / L'association / Assemblée générale", eyebrow: "L'association · Documents officiels", title: 'Assemblée Générale', lede: "<p>L'Assemblée Générale se réunit une fois par an. Les membres du comité directeur sont élus lors de cette réunion.</p>" }),
      { key: 'vide', label: 'Message si aucun document', type: 'rich', default: "<p>Aucun document disponible pour l'instant.</p>" },
    ],
  },
  {
    id: 'espace-adherents',
    label: 'Espace adhérents',
    href: '/espace-adherents',
    fields: [
      { key: 'eyebrow',      label: 'Accroche',                      type: 'text', default: 'Espace adhérents' },
      { key: 'login_titre',  label: 'Connexion — titre',             type: 'text', default: 'Accès réservé' },
      { key: 'login_texte',  label: 'Connexion — texte',             type: 'rich', default: "<p>Mot de passe communiqué lors de l'inscription.</p>" },
      { key: 'res_titre',    label: 'Ressources — titre',            type: 'text', default: 'Ressources réservées' },
      { key: 'liens_titre',  label: 'Bloc liens — titre',            type: 'text', default: 'Liens adhérents' },
      { key: 'liens_intro',  label: 'Bloc liens — introduction',     type: 'rich', default: '<p>Albums photos, vidéos, documents et ressources partagées avec les membres.</p>' },
      { key: 'vide',         label: 'Message si aucun lien',         type: 'rich', default: "<p>Aucun lien réservé n'est publié pour le moment.</p>" },
    ],
  },
  {
    id: 'mentions-legales',
    label: 'Mentions légales',
    href: '/mentions-legales',
    fields: [
      ...header({ crumb: 'Accueil / Mentions légales', eyebrow: 'Informations légales', title: 'Mentions légales' }),
      {
        key: 'contenu',
        label: 'Contenu de la page',
        type: 'rich',
        minHeight: 360,
        default: [
          '<h2>Éditeur du site</h2>',
          '<p><strong>Association Gym Marche Rambouillet (AGMR)</strong><br>50, rue du Muguet — 78120 Rambouillet<br><a href="mailto:contact@gymmarche.fr">contact@gymmarche.fr</a><br>Association loi 1901 — créée en 1970<br>SIRET : à compléter</p>',
          '<h2>Hébergement</h2>',
          '<p><strong>Vercel Inc.</strong><br>440 N Barranca Ave #4133<br>Covina, CA 91723, USA<br><a href="https://vercel.com">vercel.com</a></p>',
          '<h2>Données personnelles</h2>',
          "<p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p>",
          '<p>Pour exercer ce droit, contactez-nous à : <a href="mailto:contact@gymmarche.fr">contact@gymmarche.fr</a></p>',
          '<h2>Cookies</h2>',
          "<p>Ce site n'utilise pas de cookies de traçage ou publicitaires. Des cookies techniques nécessaires au fonctionnement du site peuvent être déposés.</p>",
          '<h2>Propriété intellectuelle</h2>',
          "<p>L'ensemble du contenu de ce site (textes, images, logos) est la propriété de l'AGMR ou de ses partenaires. Toute reproduction est interdite sans autorisation préalable.</p>",
        ].join(''),
      },
    ],
  },
]

export function siteTextPage(pageId) {
  return SITE_TEXT_PAGES.find(p => p.id === pageId)
}

// Fusionne les valeurs enregistrées (lignes { key, value }) avec les valeurs par défaut d'une page
export function mergeSiteTexts(pageId, rows = []) {
  const page = siteTextPage(pageId)
  const out = {}
  for (const f of page?.fields ?? []) out[f.key] = f.default
  for (const row of rows) {
    const [p, ...rest] = row.key.split('.')
    if (p !== pageId) continue
    const field = rest.join('.')
    if (row.value !== null && row.value !== undefined && row.value !== '') out[field] = row.value
  }
  return out
}
