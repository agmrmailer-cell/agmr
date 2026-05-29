import Icon from '@/components/ui/Icon'

export default function AdminGuideSection() {
  return (
    <div style={{ maxWidth: 860 }}>

      <div className="admin-head">
        <div>
          <h1>Guide d'utilisation</h1>
          <p className="muted" style={{ margin: 0 }}>Back-office AGMR · Saison 2025-2026</p>
        </div>
      </div>

      {/* Intro */}
      <div style={{ background: 'var(--green-tint)', border: '1px solid var(--green-soft)', borderRadius: 'var(--r-md)', padding: '18px 22px', marginBottom: 32, fontSize: '0.95rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        Ce back-office vous permet de gérer l'ensemble du contenu du site AGMR sans aucune compétence technique.
        Toutes les modifications sont enregistrées en temps réel et visibles immédiatement sur le site public.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <GuideBlock
          icon={<Icon name="home" size={18}/>}
          title="Page principale"
          section="Activités → Page principale"
          items={[
            ["Hero (bannière d'accueil)", "Modifiez le titre, le sous-titre, les boutons d'action et la photo de fond. La photo doit être au format 16:9, minimum 1920×1080 px."],
            ["Blocs d'activités", "Activez ou désactivez chaque activité (Gym, Rando, Nordique), modifiez les textes et les photos."],
            ["Manifesto", "La section 'Notre philosophie' — modifiez le texte et la citation mise en avant."],
            ["Bannière CTA", "Le bandeau rouge en bas de page avec le bouton d'inscription."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="calendar" size={18}/>}
          title="Planning Gym"
          section="Activités → Planning Gym"
          items={[
            ["Ajouter un créneau", "Cliquez sur « Ajouter un créneau ». Renseignez le jour, l'horaire, la discipline, l'animateur et la salle."],
            ["Récurrence", "Par défaut : toutes les semaines. Vous pouvez définir 1 semaine sur 2, le Nᵉ lundi du mois, etc. — identique à Google Agenda."],
            ["Marquer complet / Activer", "Utilisez le switch Actif pour masquer un cours, ou cochez Complet pour bloquer les inscriptions."],
            ["Filtres", "Filtrez par jour (chips en haut) et par discipline (menu déroulant multi-sélection). La recherche est disponible dans le menu discipline."],
            ["Export PDF", "Le bouton « Exporter PDF » génère un planning imprimable selon les filtres actifs."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="sun" size={18}/>}
          title="Vacances scolaires"
          section="Activités → Vacances scolaires"
          items={[
            ["Ajouter une période", "Renseignez le nom, les dates de début/fin et la zone scolaire (C par défaut pour Rambouillet)."],
            ["Effet sur le planning", "Les jours de vacances sont automatiquement grisés sur le planning gym public — aucun cours ne s'affiche pendant ces périodes."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="mountain" size={18}/>}
          title="Planning Randonnée"
          section="Activités → Planning Rando"
          items={[
            ["Programmer une sortie", "Renseignez la date, le type (Rando jeudi, dimanche, nordique…), le titre, la distance, le dénivelé, l'heure et le point de départ."],
            ["Marquer complet / Annuler", "Utilisez les boutons rapides sur chaque ligne du tableau. Une sortie annulée reste visible avec un badge rouge."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="file" size={18}/>}
          title="Actualités"
          section="Contenus → Actualités"
          items={[
            ["Créer un article", "Choisissez la catégorie (Gym, Rando, Asso…), la date, rédigez le titre et le contenu."],
            ["Image d'illustration", "Cliquez sur « Choisir et recadrer ». Une fenêtre s'ouvre : déplacez l'image pour cadrer, ajustez le zoom et l'inclinaison, choisissez le ratio. Le format 16:9 est recommandé car l'image de l'article le plus récent s'affiche en grand sur la page d'accueil."],
            ["Publication", "L'article est immédiatement visible sur le site après enregistrement."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="pin" size={18}/>}
          title="Séjours"
          section="Contenus → Séjours"
          items={[
            ["Créer un séjour", "Renseignez le titre, les dates (texte libre), le transport et une description. Ajoutez une photo ou choisissez une couleur de carte."],
            ["Statuts", "Ouverte : inscriptions possibles. Complet : le badge rouge s'affiche. Terminé : le séjour est archivé mais reste visible."],
            ["Actions rapides", "Les boutons Complet / Rouvrir / Terminer sont disponibles directement sur chaque ligne du tableau."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="image" size={18}/>}
          title="Galerie photos"
          section="Contenus → Galerie"
          items={[
            ["Albums", "Les photos sont organisées par albums. Cliquez sur un album pour l'ouvrir. Vous pouvez renommer ou supprimer un album entier."],
            ["Uploader des photos", "Sélectionnez un album existant ou créez-en un nouveau, puis cliquez « Choisir des photos ». Les images sont automatiquement converties en WebP et stockées sur Cloudinary."],
            ["Suppression multiple", "Cliquez sur « ☑ Sélectionner » pour passer en mode sélection, cochez les photos à supprimer, puis confirmez."],
            ["Vue publique", "Les visiteurs voient les albums sous forme de cartes, peuvent ouvrir chaque photo en plein écran (lightbox) et télécharger les photos en JPG."],
          ]}
        />

        <GuideBlock
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M14.5 9a3.5 3.5 0 0 0-5 0v6a3.5 3.5 0 0 0 5 0M9 12h5"/>
            </svg>
          }
          title="Tarifs"
          section="Association → Tarifs"
          items={[
            ["Modifier un tarif", "Cliquez directement dans le champ « Tarif » ou « Note », saisissez la valeur (ex : 32 €) et appuyez sur Entrée. Un ✓ vert confirme l'enregistrement."],
            ["Ajouter / Supprimer une ligne", "Le bouton « + Ajouter une ligne » en bas de chaque tableau crée une nouvelle entrée. La poubelle ☁ à droite de chaque ligne la supprime."],
            ["Message global", "Le champ en bas de page affiche un message sous les tableaux (ex : date du Forum des Associations)."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="file" size={18}/>}
          title="Assemblée Générale"
          section="Association → Assemblée générale"
          items={[
            ["Saisons", "Les documents sont organisés par saison (ex : 2024-2025). Créez une nouvelle saison avec le bouton dédié."],
            ["Uploader un PDF", "Dans le formulaire d'ajout/édition, cliquez « Uploader un PDF » pour envoyer le fichier directement depuis votre ordinateur. Le fichier est stocké sur Supabase et un lien permanent est généré."],
            ["Ordre d'affichage", "Le champ « Ordre » détermine la position du document dans la liste (1 = en premier)."],
          ]}
        />

        <GuideBlock
          icon={<Icon name="lock" size={18}/>}
          title="Gestion des accès"
          section="Paramètres → Gestion des accès"
          items={[
            ["Rôles", "Super Admin : accès complet à tout le back-office. Admin : accès limité aux sections autorisées."],
            ["Inviter un administrateur", "Renseignez l'adresse e-mail et cochez les sections auxquelles la personne doit avoir accès. Elle recevra un e-mail d'invitation."],
            ["Révoquer un accès", "Utilisez le bouton de suppression sur la ligne de l'administrateur concerné."],
          ]}
        />

        {/* Conseils généraux */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          <div style={{ background: 'var(--green)', padding: '14px 20px' }}>
            <h3 style={{ color: '#fff', fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="sun" size={16}/> Conseils généraux
            </h3>
          </div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ["Enregistrement automatique", "La plupart des champs s'enregistrent au clic en dehors ou à la pression d'Entrée. Un ✓ vert confirme la sauvegarde."],
              ["Lien « Voir la page »", "Chaque section propose un lien pour ouvrir directement la page publique correspondante et vérifier le résultat."],
              ["Images", "Privilégiez les photos en format paysage (16:9) pour le hero et les actualités, 4:3 pour les séjours. Le back-office convertit automatiquement vos images en WebP pour optimiser les performances du site."],
              ["En cas de problème", "Contactez l'administrateur technique. Aucune action dans ce back-office n'est irréversible sans confirmation préalable."],
            ].map(([titre, texte]) => (
              <div key={titre} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--line-soft)' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--ink)', minWidth: 200, flexShrink: 0 }}>{titre}</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', lineHeight: 1.55 }}>{texte}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function GuideBlock({ icon, title, section, items }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      {/* En-tête */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--green-tint)', border: '1px solid var(--green-soft)', display: 'grid', placeItems: 'center', color: 'var(--green)', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-mute)', marginTop: 2, letterSpacing: '0.04em' }}>
            Menu : {section}
          </div>
        </div>
      </div>
      {/* Contenu */}
      <div style={{ padding: '4px 0' }}>
        {items.map(([titre, texte]) => (
          <div key={titre} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '8px 16px', padding: '12px 20px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-soft)', paddingTop: 1 }}>{titre}</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--ink-mute)', lineHeight: 1.6 }}>{texte}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
