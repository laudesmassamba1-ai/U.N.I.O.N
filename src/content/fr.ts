export const site = {
  name: 'U.N.I.O.N',
  longName: "Union Nationale pour l'Unité",
  shortName: 'Union Nationale pour l’Unité',
  motto: 'Un Congo uni travaille. Un Congo divisé mendie.',
  mottoFirst: 'Un Congo uni travaille.',
  mottoSecond: 'Un Congo divisé mendie.',
  country: 'Congo-Brazzaville',
  status: 'Mouvement en cours de constitution.',
  whatsappUrl: (import.meta.env.VITE_WHATSAPP_URL ?? '').trim(),
  unionEmail: (import.meta.env.VITE_UNION_EMAIL ?? '').trim(),
  founderNote:
    'Les noms des membres du Bureau sont publiés avec l’accord de chaque personne. Les postes sont pourvus au fur et à mesure.',
  emptyJournal: 'Première édition à venir.',
  journalTitle: 'Infos de la semaine au Congo',
  studioNotice:
    'Le journal est publié par un mouvement politique. Il ne s’agit pas d’un média indépendant.',
  correctionNotice:
    'Chaque modification d’un article est datée. L’historique des versions est conservé dans le Studio.',
  privacyShort:
    'La boîte à suggestions reste anonyme. La carte de membre demande un nom et une adresse e-mail, utilisés uniquement pour envoyer la carte.',
} as const;

export const nav = [
  { href: '/', label: 'Accueil' },
  { href: '/union', label: 'L’U.N.I.O.N' },
  { href: '/charte', label: 'La Charte' },
  { href: '/bureau', label: 'Le Bureau' },
  { href: '/engagements', label: 'Les engagements' },
  { href: '/departements', label: 'Les 12 départements' },
  { href: '/journal', label: 'Le journal' },
  { href: '/suggestions', label: 'Boîte à suggestions' },
  { href: '/rejoindre', label: 'Rejoindre' },
  { href: '/carte', label: 'Carte de membre' },
] as const;

export const footerNav = [
  {
    title: 'Le mouvement',
    links: [
      { href: '/union', label: 'L’U.N.I.O.N' },
      { href: '/charte', label: 'La Charte' },
      { href: '/bureau', label: 'Le Bureau' },
      { href: '/engagements', label: 'Les engagements' },
      { href: '/departements', label: 'Les 12 départements' },
    ],
  },
  {
    title: 'Prendre part',
    links: [
      { href: '/journal', label: 'Infos de la semaine au Congo' },
      { href: '/suggestions', label: 'Boîte à suggestions' },
      { href: '/rejoindre', label: 'Rejoindre' },
      { href: '/carte', label: 'Carte de membre' },
      { href: '/documents', label: 'Documents' },
      { href: '/faq', label: 'Questions fréquentes' },
    ],
  },
  {
    title: 'Informations',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/vie-privee', label: 'Vie privée' },
      { href: '/accessibilite', label: 'Accessibilité' },
    ],
  },
] as const;

export const home = {
  eyebrow: 'Mouvement en cours de constitution',
  titleTop: 'Un Congo',
  titleBottom: 'divisé mendie.',
  titleFinalLeft: 'Un Congo',
  titleFinalRight: 'uni travaille.',
  intro:
    'L’U.N.I.O.N est un mouvement congolais qui combat le tribalisme par des actes. Il rassemble des femmes et des hommes de tous les départements autour d’une idée simple : le travail commun.',
  primaryCta: 'Lire la Charte',
  secondaryCta: 'Rejoindre le groupe WhatsApp',
  journalCta: 'Lire le journal',
  suggestionsCta: 'Déposer une suggestion',
  junctionLabel: 'La jonction',
  junctionText:
    'Deux moitiés d’une même page se rapprochent, se touchent, puis tiennent ensemble.',
  reasons: [
    {
      key: 'guerir',
      word: 'Guérir',
      title: 'Guérir le Congo du tribalisme',
      text: 'Guérir le Congo du tribalisme, par des actes plutôt que par des discours. Montrer que toutes les régions du pays peuvent travailler ensemble.',
    },
    {
      key: 'prouver',
      word: 'Prouver',
      title: 'Prouver par l’exemple',
      text: 'Par l’exemple. Les fondateurs viennent de régions différentes du pays et construisent le mouvement ensemble.',
    },
    {
      key: 'travailler',
      word: 'Travailler',
      title: 'Travailler ensemble',
      text: 'Montrer que toutes les régions du pays peuvent travailler ensemble.',
    },
  ],
  ambitionTitle: 'Notre ambition',
  ambition:
    'Nous ne visons pas un siège demain. Demain, le quartier doit cesser de se diviser.',
  statusTitle: 'Où en est le mouvement ?',
  statusText: 'Mouvement en cours de constitution.',
  sealText: 'Un Congo uni travaille.',
  roadmapTitle: 'Feuille de route publique',
  roadmapIntro: 'Les étapes franchies et les chantiers en cours, mis à jour au fil des avancées.',
  joinTitle: 'Rejoindre l’U.N.I.O.N',
  joinText:
    'Le groupe WhatsApp est le canal du mouvement. Vous y posez vos questions et suivez les annonces.',
  joinUnavailable:
    'Le lien d’invitation sera publié ici dès son ouverture publique.',
} as const;

export const unionPage = {
  eyebrow: 'Le mouvement',
  title: 'L’U.N.I.O.N',
  intro:
    'Union Nationale pour l’Unité. Un mouvement congolais en cours de constitution, fondé sur le travail commun et le refus du tribalisme.',
  sigleTitle: 'Le sens du sigle',
  sigle: [
    { letter: 'U', word: 'Union' },
    { letter: 'N', word: 'Nationale' },
    { letter: 'I O N', word: 'pour l’unité' },
  ],
  sigleNote:
    'Le sigle se lit U.N.I.O.N. Il n’a pas d’autre expansion validée à ce jour.',
  butTitle: 'Notre but',
  butText:
    'Guérir le Congo du tribalisme, par des actes plutôt que par des discours. Montrer que toutes les régions du pays peuvent travailler ensemble.',
  tribalismeTitle: 'Ce que nous combattons',
  tribalismeText:
    'Aimer sa région d’origine n’est pas du tribalisme. Le tribalisme commence quand on refuse de travailler avec l’autre ou qu’on décide de sa place selon son origine.',
  raisonsTitle: 'Trois raisons d’agir',
  raisons: [
    {
      word: 'Guérir',
      text: 'Guérir le Congo du tribalisme, par des actes plutôt que par des discours.',
    },
    {
      word: 'Prouver',
      text: 'Par l’exemple. Les fondateurs viennent de régions différentes du pays et construisent le mouvement ensemble.',
    },
    {
      word: 'Travailler',
      text: 'Montrer que toutes les régions du pays peuvent travailler ensemble.',
    },
  ],
  ambitionTitle: 'Une ambition concrète',
  ambitionText:
    'Nous ne visons pas un siège demain. Demain, le quartier doit cesser de se diviser.',
  statusTitle: 'Statut du mouvement',
  statusText: 'Mouvement en cours de constitution.',
} as const;

export const charter = {
  eyebrow: 'La Charte',
  title: 'La Charte de l’U.N.I.O.N',
  subtitle: 'Projet soumis à validation des fondateurs.',
  intro:
    'Quatre articles pour tenir l’unité dans les actes, dans les équipes et dans les réunions.',
  printLabel: 'Imprimer la Charte',
  articles: [
    {
      number: 1,
      title: 'Les mêmes règles pour tous',
      paragraphs: [
        'Aucun poste, aucune candidature et aucun soutien n’est attribué selon l’ethnie, le village d’origine ou la religion. On ne demande à personne d’où il vient pour décider de sa place.',
        'Les responsabilités sont confiées selon l’engagement, la compétence et les actes.',
        'Chaque bureau cherche l’équilibre : des membres engagés dans des départements différents, une place réelle pour les femmes et pour les jeunes de moins de 35 ans. Le bureau publie ses objectifs et ses résultats.',
      ],
    },
    {
      number: 2,
      title: 'Une présence dans tout le pays',
      paragraphs: [
        'Pour porter les couleurs de l’U.N.I.O.N à une élection, il faut avoir contribué à des actions du mouvement dans au moins 6 des 12 départements.',
        'Une action est une activité ouverte au public (rencontre, atelier, service rendu), menée avec des membres d’au moins deux départements, consignée dans un compte rendu publié et validée par le Secrétaire Général.',
        'L’action peut être menée par une équipe locale : ce qui compte, c’est la présence sur le terrain, pas le nombre de kilomètres parcourus.',
        'Cette règle s’applique dès que le mouvement dispose d’un cadre légal lui permettant de présenter des candidats.',
      ],
    },
    {
      number: 3,
      title: 'Que tout le monde comprenne',
      paragraphs: [
        'Dans les réunions publiques, l’U.N.I.O.N s’exprime en français et dans au moins une langue nationale largement partagée sur place (lingala ou kituba), pour que chacun comprenne.',
        'Chacun peut prendre la parole dans la langue qu’il maîtrise. Son intervention est reprise dans une langue commune.',
      ],
    },
    {
      number: 4,
      title: 'Deux engagements concrets',
      paragraphs: [
        'Les binômes de l’Union : l’U.N.I.O.N veut accompagner chaque année douze jeunes, un par département, répartis en binômes de deux départements différents (département de résidence), pour lancer une activité ensemble. L’accompagnement dépend des moyens du mouvement. Aucun montant n’est promis tant que les fonds n’existent pas. Les activités lancées appartiennent aux jeunes : elles n’utilisent ni le nom ni l’emblème de l’U.N.I.O.N.',
        'Le Pacte de Poto-Poto : chaque membre s’engage à ne pas tenir de propos qui rabaissent une personne ou un groupe à cause de son origine, en public ou au nom du mouvement. En cas de manquement, un signalement écrit est examiné : le membre est entendu, le bureau rend une décision motivée, et une suspension de 1 à 6 mois peut être prononcée selon la gravité. Un recours est possible devant l’assemblée des fondateurs. L’U.N.I.O.N ne surveille pas les conversations privées.',
      ],
    },
  ],
} as const;

export const board = {
  eyebrow: 'Le Bureau',
  title: 'Bureau exécutif national, en constitution',
  intro:
    'Cinq postes. Les noms sont publiés avec l’accord de chaque personne.',
  vacant: 'Poste à pourvoir',
  vacantSingleLine: 'Les postes sont pourvus au fur et à mesure.',
  goldenRuleTitle: 'Règle d’équilibre',
  goldenRule:
    'Le Président et les deux Vice-Présidents sont rattachés à trois zones de mobilisation différentes.',
  zonesTitle: 'Les zones de mobilisation',
  zonesText:
    'La liste des zones sera publiée avec le Bureau.',
  note: 'Les postes sont pourvus au fur et à mesure avec l’accord de chaque personne.',
  posts: [
    {
      key: 'president',
      title: 'Président National',
      detail: 'Représente le mouvement, préside le bureau, valide les décisions.',
      mission:
        'Représente le mouvement et préside le bureau exécutif. Son nom sera publié avec son accord écrit.',
    },
    {
      key: 'vp-nord',
      title: 'Vice-Président chargé de la zone Nord',
      detail: 'Coordination de la zone Nord',
      mission:
        'Coordonne les actions et la mobilisation dans les départements de la zone Nord.',
    },
    {
      key: 'vp-sud',
      title: 'Vice-Président chargé de la zone Sud',
      detail: 'Coordination de la zone Sud',
      mission:
        'Coordonne les actions et la mobilisation dans les départements de la zone Sud.',
    },
    {
      key: 'secretaire',
      title: 'Secrétaire Général',
      detail: 'Administration, procès-verbaux, validation des actions de terrain',
      mission:
        'Organise les réunions, tient les comptes rendus et valide les comptes rendus d’actions de terrain.',
    },
    {
      key: 'tresorier',
      title: 'Trésorier Général',
      detail: 'Gestion des finances et transparence des comptes',
      mission:
        'Gère les finances du mouvement, publie les comptes et assure la transparence financière.',
    },
  ],
} as const;

export const engagements = {
  eyebrow: 'Les engagements',
  title: 'Des actes, pas seulement des mots',
  intro:
    'La Charte fixe quatre articles. Deux actions concrètes et une règle de présence sur tout le territoire en découlent.',
  items: [
    {
      key: 'binomes',
      name: 'Les binômes de l’Union',
      lead: 'Douze jeunes par an, un par département, en binômes inter-départementaux.',
      body: [
        'L’U.N.I.O.N veut accompagner chaque année douze jeunes, un par département, répartis en binômes de deux départements différents pour lancer une activité ensemble.',
        'Ce que le mouvement ne promet pas encore : l’accompagnement dépend des moyens du mouvement. Aucun montant n’est promis tant que les fonds n’existent pas. Les activités lancées appartiennent aux jeunes.',
      ],
      promise: 'Accompagner douze jeunes par an, un par département, en binômes de deux départements différents.',
      notYet: 'Aucun montant n’est promis tant que les fonds n’existent pas. Calendrier soumis aux moyens du mouvement.',
      responsible: 'Trésorier Général',
      action: 'Voir les départements',
      href: '/departements',
    },
    {
      key: 'pacte',
      name: 'Le Pacte de Poto-Poto',
      lead: 'Tolérance zéro pour les propos rabaissant une personne selon son origine.',
      body: [
        'Chaque membre s’engage à ne pas tenir de propos qui rabaissent une personne ou un groupe à cause de son origine, en public ou au nom du mouvement.',
        'Ce que le mouvement ne promet pas encore : l’examen repose sur un signalement écrit et une audition contradictoire. L’U.N.I.O.N ne surveille pas les conversations privées.',
      ],
      promise: 'Signalement écrit, audition du membre, décision motivée et suspension de 1 à 6 mois en cas de manquement.',
      notYet: 'Procédure détaillée soumise à validation des fondateurs. Pas de surveillance de la sphère privée.',
      responsible: 'Secrétaire Général',
      action: 'Lire la Charte',
      href: '/charte',
    },
    {
      key: 'presence',
      name: 'Une présence dans tout le pays',
      lead: 'Six départements sur douze avant toute candidature électorale.',
      body: [
        'Pour porter les couleurs de l’U.N.I.O.N à une élection, il faut avoir contribué à des actions publiques du mouvement dans au moins 6 des 12 départements.',
        'Ce que le mouvement ne promet pas encore : cette règle s’applique dès que le mouvement dispose d’un cadre légal lui permettant de présenter des candidats.',
      ],
      promise: 'Contribution prouvée à des actions ouvertes au public dans au moins 6 départements, consignées et validées.',
      notYet: 'Applicable dès que le mouvement dispose du statut légal nécessaire pour présenter des candidats.',
      responsible: 'Président National',
      action: 'Voir la carte',
      href: '/departements',
    },
  ],
} as const;

export const departments = [
  { name: 'Brazzaville', kind: 'Ville-département' },
  { name: 'Pointe-Noire', kind: 'Ville-département' },
  { name: 'Bouenza', kind: 'Département' },
  { name: 'Cuvette', kind: 'Département' },
  { name: 'Cuvette-Ouest', kind: 'Département' },
  { name: 'Kouilou', kind: 'Département' },
  { name: 'Lékoumou', kind: 'Département' },
  { name: 'Likouala', kind: 'Département' },
  { name: 'Niari', kind: 'Département' },
  { name: 'Plateaux', kind: 'Département' },
  { name: 'Pool', kind: 'Département' },
  { name: 'Sangha', kind: 'Département' },
] as const;

export const departmentsPage = {
  eyebrow: 'Le territoire',
  title: 'Les 12 départements',
  intro:
    'La carte sert au travail commun et à la règle des 12 départements. Les actions vérifiées y sont consignées au fur et à mesure.',
  mapLabel: 'Carte des 12 départements de la République du Congo',
  none: 'Aucune action consignée pour l’instant.',
  actionsTitle: 'Journal des actions sur le terrain',
  bourseToggle: 'Les binômes de l’Union',
  bourseNote:
    'Le mode Binômes de l’Union relie les départements par binômes inter-départementaux.',
  attribution:
    'Tracés des 12 départements issus de geoBoundaries ADM1, sous licence Creative Commons Attribution 4.0 (CC BY 4.0).',
  listTitle: 'La liste des départements',
} as const;

export const journalPage = {
  eyebrow: 'Le journal',
  title: 'Infos de la semaine au Congo',
  intro:
    'Le journal hebdomadaire de l’U.N.I.O.N. Chaque édition rassemble les informations de la semaine, avec leurs sources.',
  notice: site.studioNotice,
  empty: site.emptyJournal,
  emptyNote:
    'Le journal est prêt pour la première édition. Les articles publiés dans le Studio apparaissent ici sans redéploiement.',
  filters: {
    allCategories: 'Toutes les catégories',
    allDepartments: 'Tous les départements',
    category: 'Catégorie',
    department: 'Département',
    reset: 'Effacer les filtres',
  },
  readArticle: 'Lire l’article',
  edition: 'Édition',
  weekOf: 'Semaine du',
  editor: 'Publié par l’U.N.I.O.N',
  modified: 'Modifié le',
  published: 'Publié le',
  share: 'Partager sur WhatsApp',
  sources: 'Sources',
  natureLabels: {
    info: 'Info',
    analyse: 'Analyse',
    opinion: 'Opinion',
  },
  categories: [
    'Vie du mouvement',
    'Départements',
    'Jeunesse',
    'Femmes',
    'Travail et activité',
    'Institutions',
  ],
  correction: site.correctionNotice,
  notFound: 'Cet article n’existe pas ou n’est plus publié.',
} as const;

export const suggestionCategories = [
  'Lutte contre le tribalisme',
  'Jeunesse et emploi',
  'Éducation et formation',
  'Départements et services',
  'Transparence et justice',
  'Langues et culture',
] as const;

export const suggestionsPage = {
  eyebrow: 'Boîte à suggestions',
  title: 'Boîte à suggestions',
  intro:
    'Toute personne peut déposer une suggestion sans compte. Les suggestions validées sont lisibles par tous. Les votes sont indicatifs.',
  formTitle: 'Déposer une suggestion',
  formHelp:
    '20 à 600 caractères. Aucun nom, aucun e-mail, aucun numéro. Les suggestions sont examinées par le bureau avant affichage public.',
  textLabel: 'Votre suggestion',
  textPlaceholder:
    'Décrivez votre idée en quelques phrases, sans mention de nom ni coordonnées personnelles.',
  categoryLabel: 'Catégorie',
  departmentLabel: 'Département (facultatif)',
  departmentNone: 'Ne pas préciser',
  submit: 'Déposer la suggestion',
  submitting: 'Transmission en cours',
  received: 'Reçue',
  receivedTitle: 'Suggestion transmise',
  receivedText:
    'Votre suggestion a été transmise au serveur. Elle sera examinée par le bureau avant publication dans la liste publique.',
  moderationNote:
    'Une suggestion apparaît publiquement après examen dans le Studio. Ce délai permet de retirer insultes, coordonnées personnelles et liens non autorisés.',
  listTitle: 'Suggestions publiées',
  emptyList: 'Aucune suggestion publiée pour l’instant.',
  voteUseful: 'Utile',
  voteNotUseful: 'Pas utile',
  voteHint: 'Les résultats s’affichent après votre vote.',
  voteIndicative:
    'Les votes sont indicatifs. Un identifiant anonyme généré sur l’appareil est associé à chaque vote.',
  statusLabels: {
    pending: 'En attente d’examen',
    discussion: 'En discussion',
    retained: 'Retenue',
    adapted: 'Adaptée',
    integrated: 'Intégrée',
    archived: 'Archivée',
    expired: 'Expirée',
    hidden: 'Masquée',
  },
  statusDescriptions: {
    pending: 'La suggestion attend l’examen du bureau.',
    discussion: 'La suggestion est publiée et reçoit des votes.',
    retained: 'Le seuil de soutien est atteint. Le bureau examine la proposition.',
    adapted: 'Le bureau a publié une réponse et adapte la suggestion.',
    integrated: 'La proposition est intégrée au travail du mouvement.',
    archived: 'La suggestion est retirée de la liste publique.',
    expired: 'La suggestion n’a pas atteint le seuil requis dans les délais.',
    hidden: 'La suggestion a été masquée.',
  },
  thresholdsTitle: 'Seuils indicatifs',
  thresholdsNote:
    'Seuils configurables depuis le Studio.',
  thresholds: [
    'Au moins 25 votes et au moins 65 % d’avis « Utile » : Retenue.',
    'Au moins 25 votes et au moins 70 % d’avis « Pas utile » : Archivée.',
    '60 jours sans atteindre le seuil de votes : Expirée.',
  ],
  localNote: 'Les suggestions sont transmises de façon anonyme au serveur.',
  voteRecorded: 'Votre vote a été pris en compte.',
  alreadyVoted: 'Vous avez déjà voté sur cette suggestion. Vous pouvez modifier votre vote.',
  rateLimit:
    'Deux suggestions par heure au maximum depuis cet appareil. Veuillez patienter avant de renouveler l’envoi.',
  validation: {
    tooShort: 'La suggestion doit contenir au moins 20 caractères.',
    tooLong: 'La suggestion ne doit pas dépasser 600 caractères.',
    category: 'Choisissez une catégorie.',
    personal: 'Retirez les numéros de téléphone, les adresses et les e-mails.',
    link: 'Les liens ne sont pas acceptés.',
    hate: 'Ce texte contient des insultes ou des propos qui ne sont pas acceptés.',
    duplicate: 'Cette suggestion a déjà été déposée.',
  },
} as const;

export const joinPage = {
  eyebrow: 'Rejoindre',
  title: 'Rejoindre l’U.N.I.O.N',
  intro:
    'Le groupe WhatsApp est le canal du mouvement. Vous y posez vos questions et suivez les annonces.',
  primaryTitle: 'Le canal du mouvement',
  primaryText:
    'Le groupe WhatsApp est le canal du mouvement. Vous y posez vos questions et suivez les annonces.',
  whatsapp: 'Rejoindre le groupe WhatsApp',
  unavailable:
    'Le lien d’invitation au groupe WhatsApp sera publié ici.',
  privacyTitle: 'Confidentialité',
  privacyText:
    'Rejoindre le groupe s’effectue directement dans WhatsApp. La carte de membre demande un nom et une adresse e-mail, utilisés seulement pour transmettre le dossier et envoyer la carte.',
  commitmentTitle: 'Engagement pour l’unité',
  commitmentText:
    'L’adhésion repose sur le respect de la Charte et le refus de tout propos rabaissant une personne en raison de son origine.',
} as const;

export const memberCardPage = {
  eyebrow: 'Carte de membre',
  title: 'Recevoir sa carte de membre',
  intro:
    'Indiquez votre nom, votre adresse e-mail et, si vous le souhaitez, votre numéro de téléphone, un selfie et une pièce d’identité. Votre dossier part au bureau, au Studio et à vous-même.',
  stepsTitle: 'Comment ça marche',
  steps: [
    {
      title: 'Vous remplissez',
      text: 'Nom, adresse e-mail, numéro facultatif, selfie et pièce d’identité facultatifs, accord explicite.',
    },
    {
      title: 'Le dossier part',
      text: 'Le bureau et le Studio reçoivent votre demande avec les documents joints, pour vérifier et délivrer la carte.',
    },
    {
      title: 'Vous recevez la carte',
      text: 'La carte arrive à l’adresse indiquée, avec son numéro et la date de délivrance.',
    },
  ],
  mailTitle: 'Envoyer le dossier depuis votre messagerie',
  mailText:
    'Ce chemin fonctionne même quand le site n’a pas de serveur : votre logiciel de messagerie s’ouvre avec le dossier déjà rempli, adressé aux deux boîtes du bureau. Le message part de votre propre adresse.',
  mailAction: 'Ouvrir ma messagerie',
  mailNote:
    'Le site ne peut pas vérifier cet envoi : c’est vous qui appuyez sur « Envoyer ». Le bureau traite ensuite la demande depuis sa boîte.',
  mailUnavailable:
    'L’envoi depuis la messagerie n’est pas configuré sur ce site. Utilisez le formulaire.',
  serverUnavailable:
    'L’envoi automatique n’est pas disponible sur cette version du site. Utilisez l’envoi depuis votre messagerie, plus bas.',
  formTitle: 'Demande de carte',
  formHelp:
    'Le nom, l’adresse e-mail et le département servent uniquement à établir la carte et à transmettre le dossier au bureau.',
  nameLabel: 'Nom complet',
  namePlaceholder: 'Prénom et nom',
  emailLabel: 'Adresse e-mail',
  emailPlaceholder: 'L’adresse à laquelle recevoir la carte',
  departmentLabel: 'Département (facultatif)',
  departmentNone: 'Ne pas préciser',
  phoneLabel: 'Numéro de téléphone (facultatif)',
  phonePlaceholder: 'Ex. +242 06 123 45 67',
  selfieLabel: 'Selfie (facultatif)',
  selfiePlaceholder: 'Prenez votre photo avec l’icône caméra',
  selfieCapture: 'Prendre une photo',
  selfieRemove: 'Retirer la photo',
  identityLabel: 'Pièce d’identité (facultatif)',
  identityPlaceholder: 'Photo ou scan de votre pièce d’identité',
  identityRemove: 'Retirer le document',
  documentsConsentLabel:
    'J’accepte que mon nom, mon adresse e-mail, mon numéro de téléphone, mon selfie et mon document d’identité soient transmis au bureau et au Studio pour vérifier et délivrer ma carte de membre.',
  consentLabel:
    'J’accepte que mon nom, mon adresse e-mail et mon département soient transmis au bureau pour établir ma carte de membre.',
  submit: 'Demander ma carte',
  submitting: 'Envoi en cours',
  sentTitle: 'Carte envoyée',
  sentText:
    'La carte a été envoyée à l’adresse indiquée. Vérifiez aussi le dossier des indésirables.',
  sentNoCardTitle: 'Dossier transmis',
  sentNoCardText:
    'Votre dossier est arrivé au bureau, mais la carte n’a pas pu être envoyée à votre adresse.',
  numberLabel: 'Numéro de carte',
  again: 'Demander une autre carte',
  privacyTitle: 'Vos données',
  privacyNote:
    'Le site ne publie aucune donnée de membre. Le nom, l’adresse e-mail, le numéro de téléphone, le selfie et le document d’identité servent uniquement à vérifier votre demande et à envoyer la carte.',
  errors: {
    name: 'Indiquez votre nom complet.',
    email: 'Indiquez une adresse e-mail valide.',
    phone: 'Indiquez un numéro de téléphone valide.',
    consent: 'Cochez la case pour accepter l’envoi de la carte.',
    documentsConsent: 'Cochez la case pour autoriser la transmission des documents au bureau et au Studio.',
    network: 'L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez.',
    selfie: 'La photo n’a pas pu être lue.',
    identity: 'Le document n’a pas pu être lu.',
    cameraUnavailable: 'La caméra n’est pas accessible sur cet appareil.',
  },
} as const;

export const documentsPage = {
  eyebrow: 'Documents',
  title: 'Documents',
  intro:
    'Les documents officiels du mouvement sont mis à disposition au fur et à mesure de leur validation.',
  items: [
    {
      title: 'Charte de l’U.N.I.O.N',
      status: 'Version de travail disponible',
      action: 'Consulter et imprimer la Charte',
      href: '/charte',
    },
    {
      title: 'Affiche de la Charte (format A3)',
      status: 'Disponible à l’impression',
      action: 'Ouvrir l’affiche imprimable',
      href: '/charte',
    },
    {
      title: 'Statuts du mouvement',
      status: 'Document en cours de finalisation',
      action: null,
      href: null,
    },
    {
      title: 'Rapport de présentation',
      status: 'À paraître',
      action: null,
      href: null,
    },
  ],
} as const;

export const faq = {
  eyebrow: 'Questions fréquentes',
  title: 'Questions fréquentes',
  intro: 'Des réponses courtes, à partir des textes validés du mouvement.',
  items: [
    {
      q: 'Qu’est-ce que l’U.N.I.O.N ?',
      a: 'L’Union Nationale pour l’Unité est un mouvement congolais en cours de constitution. Son but est de guérir le Congo du tribalisme par des actes plutôt que par des discours.',
    },
    {
      q: 'Que veut dire le sigle ?',
      a: 'U pour Union, N pour Nationale, I O N pour l’unité.',
    },
    {
      q: 'Le mouvement est-il un parti ?',
      a: 'L’U.N.I.O.N est un mouvement en cours de constitution. Aucun statut juridique définitif n’est affirmé sur ce site.',
    },
    {
      q: 'Comment rejoindre le mouvement ?',
      a: 'Le groupe WhatsApp est le canal prévu pour les échanges et les annonces, dès que son lien sera publié.',
    },
    {
      q: 'Qu’est-ce que les binômes de l’Union ?',
      a: 'L’accompagnement de douze jeunes par an, un par département, réunis par binômes de deux départements différents pour lancer une initiative commune.',
    },
    {
      q: 'Qu’est-ce que le Pacte de Poto-Poto ?',
      a: 'L’engagement de chaque membre à ne tenir aucun propos rabaissant une personne en raison de son origine, sous peine de suspension de 1 à 6 mois après examen motivé.',
    },
    {
      q: 'Comment fonctionne la boîte à suggestions ?',
      a: 'Toute personne peut déposer une idée de façon anonyme. Après examen par le bureau, elle apparaît en ligne et chacun peut voter pour exprimer son avis.',
    },
    {
      q: 'Mes données personnelles sont-elles collectées ?',
      a: 'La boîte à suggestions est anonyme. La demande de carte de membre demande un nom et une adresse e-mail, utilisés seulement pour transmettre le dossier au bureau et envoyer la carte. Aucune donnée de membre n’est publiée.',
    },
  ],
} as const;

export const contactPage = {
  eyebrow: 'Contact',
  title: 'Contact',
  intro:
    'Le groupe WhatsApp est le canal du mouvement. Vous y posez vos questions et suivez les annonces.',
  whatsapp: 'Rejoindre le groupe WhatsApp',
  unavailable:
    'Le lien d’invitation sera publié ici.',
  emailTitle: 'Adresse e-mail',
  emailText: 'Pour toute communication officielle avec le bureau.',
  mediaTitle: 'Presse et signalements',
  mediaText:
    'Pour signaler une coquille ou une précision sur un article du journal, une mention datée est ajoutée après vérification.',
  noForm:
    'Le site ne propose aucun formulaire de contact collectant des données privées.',
} as const;

export const legalPage = {
  eyebrow: 'Informations légales',
  title: 'Mentions légales',
  intro:
    'Cette page décrit l’état exact du mouvement et les conditions techniques du site.',
  sections: [
    {
      title: 'Éditeur',
      body: [
        'Éditeur : U.N.I.O.N, Union Nationale pour l’Unité.',
        'Mouvement en cours de constitution.',
        'Les textes de la Charte sont un projet soumis à validation des fondateurs.',
      ],
    },
    {
      title: 'Responsabilité éditoriale',
      body: [
        'Le journal « Infos de la semaine au Congo » est publié par l’U.N.I.O.N.',
        'Chaque article cite ses sources factuelles et vérifiables.',
      ],
    },
    {
      title: 'Hébergement',
      body: [
        'Le déploiement est préparé pour Vercel. Les coordonnées définitives de l’hébergeur et le nom de domaine seront publiés avant la mise en production.',
        'Le site de secours peut être servi par un hébergement statique, sans collecte de suggestions ni de votes.',
      ],
    },
    {
      title: 'Propriété et emblème',
      body: [
        'Le logo officiel de l’U.N.I.O.N est rendu sans modification par le composant dédié.',
      ],
    },
  ],
} as const;

export const privacyPage = {
  eyebrow: 'Vie privée',
  title: 'Vie privée',
  intro:
    'Ce que le site fait, en toute clarté. Chaque engagement ici correspond au code réel.',
  sections: [
    {
      title: 'Ce que le site demande',
      body: [
        'La boîte à suggestions ne demande rien : ni nom, ni adresse e-mail, ni numéro de téléphone.',
        'La carte de membre demande un nom complet, une adresse e-mail et, si vous le souhaitez, un département.',
        'Le site ne dépose aucun cookie publicitaire et n’emploie aucun traceur tiers.',
      ],
    },
    {
      title: 'Ce qu’il garde pour une suggestion',
      body: [
        'Pour chaque suggestion déposée, le serveur enregistre uniquement : le texte de l’idée, la catégorie choisie, le département facultatif et la date de dépôt.',
        'Une épreuve de calcul réalisée sur votre appareil protège le serveur contre les envois automatisés.',
        'Une limitation en mémoire (fondée sur une empreinte temporaire réinitialisée toutes les 24 heures) empêche les envois massifs sans jamais conserver votre adresse IP en base ni dans les journaux.',
      ],
    },
    {
      title: 'La carte de membre',
      body: [
        'Le nom, l’adresse e-mail et le département servent à transmettre votre dossier au bureau et à vous envoyer votre carte.',
        'Le dossier part au bureau par e-mail. La carte part à l’adresse que vous indiquez. Le prestataire d’envoi reçoit ces informations pour effectuer la livraison.',
        'Si vous envoyez le dossier depuis votre messagerie, le message part de votre propre adresse et le site ne voit pas son contenu.',
        'Le serveur conserve ces informations douze mois au maximum. Aucune donnée de membre n’est publiée sur le site. Le département reste facultatif.',
      ],
    },
    {
      title: 'Le cookie du Studio',
      body: [
        'Le Studio dépose un cookie de session strictement nécessaire, HttpOnly et SameSite=Strict, valable deux heures.',
        'Il sert uniquement à maintenir la connexion des personnes autorisées à publier. Il n’est pas utilisé pour la mesure d’audience et n’est pas accessible au script de la page.',
      ],
    },
    {
      title: 'Comment les votes sont comptés',
      body: [
        'Pour comptabiliser les votes sans compte utilisateur, un identifiant aléatoire est créé sur votre appareil.',
        'Le serveur n’en garde qu’une empreinte cryptographique HMAC non réversible pour garantir l’unicité du vote tout en vous permettant de modifier votre choix.',
        'Les votes sont indicatifs.',
      ],
    },
    {
      title: 'Ce que fait l’hébergeur',
      body: [
        'L’hébergeur technique de l’infrastructure peut conserver des journaux techniques de connexion temporaires nécessaires à la sécurité réseau.',
        'L’application ne stocke ni ne journalise ces données.',
      ],
    },
    {
      title: 'Durée de conservation',
      body: [
        'Les suggestions archivées ou non retenues sont conservées 90 jours à des fins d’audit éditorial, puis supprimées.',
      ],
    },
  ],
} as const;

export const accessibilityPage = {
  eyebrow: 'Accessibilité',
  title: 'Accessibilité',
  intro:
    'Le site applique les critères WCAG 2.2 niveau AA. Cette page détaille les dispositions prises pour tous les appareils.',
  sections: [
    {
      title: 'Navigation',
      body: [
        'Toutes les pages sont utilisables au clavier. Un lien d’évitement permet d’accéder directement au contenu principal.',
        'Les cibles tactiles respectent la taille minimale recommandée de 44 pixels.',
      ],
    },
    {
      title: 'Typographie et contrastes',
      body: [
        'Les polices Bitter et Public Sans sont employées avec des contrastes conformes aux normes AA.',
        'Le texte s’adapte aux réglages de grossissement du navigateur.',
      ],
    },
    {
      title: 'Mouvement et économie de données',
      body: [
        'Le site honore le réglage système « réduire les animations » ainsi que l’en-tête Save-Data pour limiter la consommation réseau.',
      ],
    },
  ],
} as const;

export const notFoundPage = {
  eyebrow: 'Page introuvable',
  title: 'Cette page n’existe pas',
  text: 'Le lien est peut-être ancien. Revenez à l’accueil ou consultez le journal.',
  home: 'Revenir à l’accueil',
  journal: 'Lire le journal',
} as const;

export const studioContent = {
  title: 'UNION Studio',
  subtitle: 'Gestion éditoriale et modération',
  gateTitle: 'Accès sécurisé',
  gateText:
    'Le Studio est réservé aux membres autorisés de l’équipe de publication. L’accès est vérifié par le serveur avec une session sécurisée.',
  codeLabel: 'Code d’accès sécurisé',
  enter: 'Se connecter au Studio',
  invalid: 'Code d’accès incorrect.',
  logout: 'Se déconnecter',
  tabs: {
    journal: 'Journal',
    moderation: 'Modération',
    roadmap: 'Feuille de route',
    settings: 'Réglages',
    edition: 'Édition',
  },
  newArticle: 'Nouvel article',
  edit: 'Modifier',
  preview: 'Aperçu',
  save: 'Enregistrer le brouillon',
  saveAndPublish: 'Publier',
  unpublish: 'Dépublier',
  archive: 'Archiver',
  delete: 'Supprimer',
  restore: 'Restaurer',
  cancel: 'Annuler',
  close: 'Fermer',
  autoSaved: 'Brouillon sauvegardé automatiquement à',
  emptyArticles: 'Aucun article. Le journal public affiche « Première édition à venir. »',
  articleFields: {
    title: 'Titre',
    standfirst: 'Chapô',
    category: 'Catégorie',
    department: 'Département',
    nature: 'Nature',
    leadImage: 'Image de une',
    alt: 'Texte alternatif de l’image de une',
    caption: 'Légende',
    credit: 'Crédit',
    sources: 'Sources',
    featured: 'Mettre à la une de l’édition',
    body: 'Corps de l’article',
  },
  blocks: {
    addParagraph: 'Ajouter un paragraphe',
    addHeading: 'Ajouter un intertitre',
    addQuote: 'Ajouter une citation',
    addList: 'Ajouter une liste',
    addImage: 'Ajouter une image',
    addSeparator: 'Ajouter un séparateur',
    up: 'Monter',
    down: 'Descendre',
    remove: 'Retirer',
    paragraph: 'Paragraphe',
    heading: 'Intertitre',
    quote: 'Citation',
    list: 'Liste',
    image: 'Image',
    separator: 'Séparateur',
    listPlaceholder: 'Un élément par ligne',
    altRequired: 'Le texte alternatif est obligatoire.',
    captionRequired: 'La légende et le crédit sont obligatoires.',
  },
  upload: 'Choisir une image',
  uploadNote:
    'L’image est redimensionnée et convertie. Les métadonnées EXIF sont retirées.',
  imageTooLarge: 'L’image dépasse 4 Mo.',
  revisions: 'Historique des versions',
  revisionAt: 'Version du',
  restoreRevision: 'Revenir à cette version',
  status: {
    draft: 'Brouillon',
    published: 'Publié',
    archived: 'Archivé',
  },
  moderation: {
    title: 'File de modération',
    pending: 'En attente',
    published: 'Publiées',
    archived: 'Archivées',
    approve: 'Approuver',
    hide: 'Masquer',
    archiveAction: 'Archiver',
    restore: 'Remettre en discussion',
    merge: 'Fusionner un doublon',
    mergePrompt: 'Identifiant de la suggestion à fusionner avec celle-ci',
    response: 'Réponse du bureau',
    responsePlaceholder:
      'Réponse publiée sur la page de la suggestion. Laissez vide pour ne pas répondre.',
    saveResponse: 'Publier la réponse',
    setAdapted: 'Marquer Adaptée',
    setIntegrated: 'Marquer Intégrée',
    reports: 'Signalements',
    upvotes: 'Utiles',
    downvotes: 'Pas utiles',
    created: 'Déposée le',
    noItems: 'Aucune suggestion dans cette file.',
    thresholds: 'Seuils',
    retention: 'Conservation',
    retentionNote:
      'Une suggestion archivée reste 90 jours dans le Studio pour l’audit, puis est supprimée.',
  },
  settings: {
    title: 'Réglages de la boîte à suggestions',
    retainedVotes: 'Votes minimum pour être retenue',
    retainedShare: 'Part d’avis « Utile » pour être retenue (%)',
    archivedVotes: 'Votes minimum pour être archivée',
    archivedShare: 'Part d’avis « Pas utile » pour être archivée (%)',
    expiryDays: 'Jours avant expiration sans seuil',
    retentionDays: 'Jours de conservation après archivage',
    save: 'Enregistrer les seuils',
    saved: 'Seuils sauvegardés.',
  },
  privacy: {
    title: 'Ce que le Studio ne fait pas',
    body: [
      'Le Studio ne conserve ni adresse IP, ni agent utilisateur, ni e-mail, ni téléphone dans les suggestions et les votes.',
      'Le Studio n’envoie pas de message aux auteurs : aucune coordonnée n’est collectée.',
    ],
  },
  edition: {
    title: 'Gestion de l’édition',
    intro:
      'Le journal et les suggestions sont synchronisés avec le serveur.',
    steps: [
      'Créez ou modifiez les articles dans l’onglet Journal.',
      'Les articles publiés sont visibles immédiatement sur le site.',
      'Téléchargez une sauvegarde si nécessaire.',
    ],
    publicTitle: 'Édition publique',
    publicText:
      'Contient les articles publiés et les suggestions publiques. Les brouillons et le journal d’audit restent protégés.',
    backupTitle: 'Sauvegarde complète',
    backupText:
      'Contient tous les articles, les brouillons, les suggestions, les votes, les signalements, les réglages et le journal d’audit.',
    downloadPublic: 'Télécharger l’édition publique',
    downloadBackup: 'Télécharger la sauvegarde',
    downloadDone: 'fichier téléchargé.',
    backupLoading: 'Chargement de la sauvegarde serveur…',
    backupRevision: 'Révision de la sauvegarde serveur',
    importTitle: 'Importer un fichier',
    importText:
      'Un fichier union-edition remplace les contenus publics et conserve les suggestions locales en attente. Un fichier union-backup remplace toutes les données locales.',
    importButton: 'Choisir un fichier JSON',
    importConfirm: 'Importer ce fichier et remplacer les données locales ?',
    imported: 'Fichier importé',
    revision: 'Révision locale',
    remoteTitle: 'Édition déjà publiée',
    remoteButton: 'Vérifier le fichier publié',
    remoteApplied: 'Édition publiée appliquée.',
    remoteSkipped: 'Aucune édition plus récente.',
    remoteMissing: 'Aucune édition publiée pour l’instant.',
    remoteInvalid: 'Le fichier publié est illisible.',
    path: 'Fichier lu par le site',
    size: 'Taille du fichier public',
    reset: 'Réinitialiser les données locales',
    resetConfirm:
      'Supprimer tous les articles, suggestions et votes de ce navigateur ? Cette action ne touche pas le fichier publié.',
    resetDone: 'Données locales supprimées.',
    warning:
      'La publication dans le Studio rend les articles visibles en moins d’une minute sans redéploiement.',
    localOnly:
      'Les sauvegardes permettent de conserver une copie locale de sécurité.',
  },
} as const;

export const articleNatures = [
  { value: 'info', label: 'Info' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'opinion', label: 'Opinion' },
] as const;

export const departmentActions: Record<string, string[]> = {
  Brazzaville: [],
  'Pointe-Noire': [],
  Bouenza: [],
  Cuvette: [],
  'Cuvette-Ouest': [],
  Kouilou: [],
  Lékoumou: [],
  Likouala: [],
  Niari: [],
  Plateaux: [],
  Pool: [],
  Sangha: [],
};
