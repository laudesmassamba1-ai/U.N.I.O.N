export const site = {
  name: 'U.N.I.O.N',
  longName: "Union Nationale pour l'Unité",
  shortName: 'Union Nationale pour l’Unité',
  motto: 'Un Congo uni travaille. Un Congo divisé mendie.',
  mottoFirst: 'Un Congo uni travaille.',
  mottoSecond: 'Un Congo divisé mendie.',
  country: 'Congo-Brazzaville',
  status: 'Mouvement en cours de constitution',
  whatsappUrl: (import.meta.env.VITE_WHATSAPP_URL ?? '').trim(),
  founderNote:
    'Le nom du Président National sera publié avec son accord écrit. Les postes pourvus seront confirmés par le bureau.',
  emptyJournal: 'Première édition à venir.',
  journalTitle: 'Infos de la semaine au Congo',
  studioNotice:
    'Le journal est publié par un mouvement politique. Il ne s’agit pas d’un média indépendant.',
  correctionNotice:
    'Chaque modification d’un article est datée. L’historique des versions est conservé dans le Studio.',
  privacyShort:
    'Nous ne demandons ni nom, ni e-mail, ni numéro. Nous ne conservons pas votre adresse IP. Votre hébergeur peut en garder une trace technique temporaire.',
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
  { href: '/adhesion', label: 'Adhésion' },
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
      { href: '/adhesion', label: 'Adhésion' },
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
      text: 'Par des actes, plutôt que par des discours.',
    },
    {
      key: 'prouver',
      word: 'Prouver',
      title: 'Prouver que l’union est possible',
      text: 'Trois créateurs. La preuve vivante qu’on peut travailler ensemble. On ne sait pas encore s’ils sont du Nord ou du Sud.',
    },
    {
      key: 'travailler',
      word: 'Travailler',
      title: 'Travailler ensemble',
      text: 'Si on reste divisés, on mendie. Si on s’unit, on travaille et on mange.',
    },
  ],
  ambitionTitle: 'Notre ambition',
  ambition:
    'Nous ne visons pas un siège demain. Demain, le quartier doit cesser de se diviser.',
  statusTitle: 'Où en est le mouvement ?',
  statusText:
    'Le mouvement est en cours de constitution. Le dépôt du dossier est prévu, à confirmer par le bureau.',
  sealText: 'Un Congo uni travaille.',
  joinTitle: 'Rejoindre l’U.N.I.O.N',
  joinText:
    'Le groupe WhatsApp est le canal principal du mouvement. Le lien est fourni par un créateur. Il est conseillé d’activer l’approbation des nouveaux participants dans WhatsApp pour limiter le spam.',
  joinUnavailable:
    'Le lien d’invitation sera publié ici après validation par le bureau.',
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
    'Guérir le Congo du tribalisme, avec des actes plutôt que des discours. Montrer que le Nord, le Sud et l’Ouest peuvent travailler ensemble.',
  tribalismeTitle: 'Ce que nous appelons le tribalisme',
  tribalismeText:
    'Aimer sa tribu n’est pas du tribalisme. Le tribalisme, c’est refuser de travailler avec l’autre.',
  raisonsTitle: 'Trois raisons',
  raisons: [
    {
      word: 'Guérir',
      text: 'Guérir le Congo du tribalisme, par des actes.',
    },
    {
      word: 'Prouver',
      text: 'Trois créateurs. La preuve vivante qu’on peut travailler ensemble. On ne sait pas encore s’ils sont du Nord ou du Sud.',
    },
    {
      word: 'Travailler',
      text: 'Si on reste divisés, on mendie. Si on s’unit, on travaille et on mange.',
    },
  ],
  ambitionTitle: 'Une ambition de quartier',
  ambitionText:
    'Nous ne visons pas un siège demain. Demain, le quartier doit cesser de se diviser.',
  statusTitle: 'Statut du mouvement',
  statusText:
    'Mouvement en cours de constitution. Le dépôt du dossier est prévu, à confirmer par le bureau.',
} as const;

export const charter = {
  eyebrow: 'La Charte',
  title: 'La Charte',
  subtitle: 'Projet soumis à validation des fondateurs.',
  intro:
    'Quatre articles pour tenir l’unité dans les actes, dans les bureaux et dans les réunions.',
  printLabel: 'Imprimer la Charte',
  articles: [
    {
      number: 1,
      title: 'On ne demande plus « tu es d’où ? »',
      paragraphs: [
        'Aucun poste n’est attribué selon l’ethnie, le village ou le département.',
        'La composition d’un bureau garantit la parité Nord/Sud, au moins 3 femmes et 3 jeunes de moins de 35 ans pour 10 postes.',
      ],
    },
    {
      number: 2,
      title: 'La règle des 12 départements',
      paragraphs: [
        'Pour être candidat de l’U.N.I.O.N à une élection, il faut avoir mené au moins une action dans 6 départements différents sur 12.',
      ],
    },
    {
      number: 3,
      title: 'Deux langues dans les réunions',
      paragraphs: [
        'Dans les réunions, deux langues seulement : le français et le lingala ou le kituba, pour que tout le monde comprenne.',
      ],
    },
    {
      number: 4,
      title: 'Deux actions concrètes',
      paragraphs: [
        'La Bourse des Frères : chaque année, 12 jeunes, un par département, sont financés pour créer ensemble une activité, obligatoirement avec une personne d’un autre département.',
        'Le Pacte de Poto-Poto : un membre qui tient un discours tribal en public ou en ligne est suspendu 6 mois.',
      ],
    },
  ],
} as const;

export const board = {
  eyebrow: 'Le Bureau',
  title: 'Bureau exécutif national',
  intro:
    'Cinq postes. Les postes pourvus seront confirmés par le bureau. Les autres affichent « Poste à pourvoir ».',
  vacant: 'Poste à pourvoir',
  goldenRuleTitle: 'La règle d’or',
  goldenRule:
    'Le Président ne peut pas être du même grand ensemble que les deux Vice-Présidents.',
  note: site.founderNote,
  posts: [
    {
      key: 'president',
      title: 'Président National',
      detail: 'Président-Fondateur, représentant légal',
      mission:
        'Porte la vision du mouvement et représente l’U.N.I.O.N. Son nom est publié avec son accord écrit.',
    },
    {
      key: 'vp-nord',
      title: 'Vice-Président Nord',
      detail: 'Mobilisation des départements du Nord',
      mission:
        'Mobilise les départements du Nord. Le classement officiel des départements en grands ensembles reste à fournir par le bureau.',
    },
    {
      key: 'vp-sud',
      title: 'Vice-Président Sud',
      detail: 'Mobilisation des départements du Sud',
      mission:
        'Mobilise les départements du Sud. Le classement officiel des départements en grands ensembles reste à fournir par le bureau.',
    },
    {
      key: 'secretaire',
      title: 'Secrétaire Général',
      detail: 'Administration, procès-verbaux, dossier au ministère',
      mission:
        'Tient l’administration du mouvement, les procès-verbaux et le dossier déposé au ministère.',
    },
    {
      key: 'tresorier',
      title: 'Trésorier Général',
      detail: 'Cotisations et financement du programme',
      mission:
        'Prépare les cotisations et le financement du programme. Les modalités de cotisation sont à venir.',
    },
  ],
} as const;

export const engagements = {
  eyebrow: 'Les engagements',
  title: 'Des actes, pas seulement des mots',
  intro:
    'La Charte fixe quatre articles. Deux actions concrètes et une règle de terrain en découlent.',
  items: [
    {
      key: 'bourse',
      name: 'La Bourse des Frères',
      lead: 'Douze jeunes, un par département.',
      body: [
        'Chaque année, 12 jeunes, un par département, sont financés pour créer ensemble une activité.',
        'Le binôme est obligatoirement composé avec une personne d’un autre département.',
      ],
      action: 'Voir les départements',
      href: '/departements',
    },
    {
      key: 'pacte',
      name: 'Le Pacte de Poto-Poto',
      lead: 'Six mois de suspension pour un discours tribal.',
      body: [
        'Un membre qui tient un discours tribal en public ou en ligne est suspendu 6 mois.',
      ],
      action: 'Lire la Charte',
      href: '/charte',
    },
    {
      key: 'douze',
      name: 'La règle des 12 départements',
      lead: 'Six départements au moins avant une candidature.',
      body: [
        'Pour être candidat de l’U.N.I.O.N à une élection, il faut avoir mené au moins une action dans 6 départements différents sur 12.',
      ],
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
    'La carte sert au travail commun et à la règle des 12 départements. Aucune action n’est consignée pour l’instant.',
  mapLabel: 'Carte schématique des 12 départements du Congo-Brazzaville',
  none: 'Aucune action consignée pour l’instant.',
  actionsTitle: 'Actions consignées',
  bourseToggle: 'Bourse des Frères',
  bourseNote:
    'Le mode Bourse des Frères relie les départements par binômes. Les binômes seront publiés après validation du bureau.',
  attribution:
    'Carte schématique. Les contours seront remplacés par une géométrie sous licence ouverte, vérifiée par le bureau.',
  listTitle: 'La liste',
} as const;

export const journalPage = {
  eyebrow: 'Le journal',
  title: 'Infos de la semaine au Congo',
  intro:
    'Le journal hebdomadaire de l’U.N.I.O.N. Chaque édition rassemble les informations de la semaine, avec leurs sources.',
  notice: site.studioNotice,
  empty: site.emptyJournal,
  emptyNote:
    'Le journal est vide tant que le bureau n’a pas publié de première édition. Aucun article d’exemple n’est publié.',
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
    '20 à 600 caractères. Aucun nom, aucun e-mail, aucun numéro. Les suggestions sont lues après validation par le bureau.',
  textLabel: 'Votre suggestion',
  textPlaceholder:
    'Décrivez votre idée en quelques phrases, sans nom ni coordonnées.',
  categoryLabel: 'Catégorie',
  departmentLabel: 'Département (facultatif)',
  departmentNone: 'Ne pas préciser',
  submit: 'Déposer la suggestion',
  submitting: 'Dépôt en cours',
  received: 'Reçue',
  receivedTitle: 'Suggestion reçue',
  receivedText:
    'Elle apparaîtra publiquement après validation par le bureau. Le délai dépend de la file de modération.',
  moderationNote:
    'Une suggestion apparaît publiquement après validation par le Studio. Ce délai permet de retirer les propos tribaux, les insultes et les données personnelles.',
  listTitle: 'Suggestions publiées',
  emptyList: 'Aucune suggestion publiée pour l’instant.',
  voteUseful: 'Utile',
  voteNotUseful: 'Pas utile',
  voteHint: 'Les résultats s’affichent après votre vote.',
  voteIndicative:
    'Les votes sont indicatifs. L’anonymat total et le principe « une personne, une voix » ne peuvent pas être garantis ensemble.',
  statusLabels: {
    pending: 'En attente de validation',
    discussion: 'En discussion',
    retained: 'Retenue',
    adapted: 'Adaptée',
    integrated: 'Intégrée',
    archived: 'Archivée',
    expired: 'Expirée',
    hidden: 'Masquée',
  },
  statusDescriptions: {
    pending: 'La suggestion attend la validation du bureau.',
    discussion: 'La suggestion est publiée et reçoit des votes.',
    retained: 'Le seuil est atteint. Le bureau examine la suggestion.',
    adapted: 'Le bureau a publié une réponse et adapte la suggestion.',
    integrated: 'La suggestion est intégrée au travail du mouvement.',
    archived: 'La suggestion disparaît de la liste publique.',
    expired: 'La suggestion n’a pas atteint le seuil de votes à temps.',
    hidden: 'La suggestion est retirée de la liste publique.',
  },
  thresholdsTitle: 'Seuils de départ',
  thresholdsNote:
    'Valeurs de départ, réglables dans le Studio et à faire valider par le bureau.',
  thresholds: [
    'Au moins 25 votes et au moins 65 % d’avis « Utile » : Retenue.',
    'Au moins 25 votes et au moins 70 % d’avis « Pas utile » : Archivée.',
    '60 jours sans atteindre 25 votes : Expirée.',
  ],
  localNote:
    'Version sans serveur : les suggestions et les votes sont conservés dans ce navigateur. Les suggestions publiées peuvent être placées dans le fichier JSON de l’édition, sans identifiant. Une suggestion déposée ici n’est pas reçue automatiquement par le bureau.',
  voteRecorded: 'Votre vote est consigné.',
  alreadyVoted: 'Vous avez déjà voté sur cette suggestion. Vous pouvez changer votre vote.',
  rateLimit:
    'Deux suggestions par heure au maximum depuis cet appareil. Réessayez plus tard.',
  validation: {
    tooShort: 'La suggestion doit contenir au moins 20 caractères.',
    tooLong: 'La suggestion ne doit pas dépasser 600 caractères.',
    category: 'Choisissez une catégorie.',
    personal: 'Retirez les numéros de téléphone, les adresses et les e-mails.',
    link: 'Les liens ne sont pas acceptés.',
    hate: 'Ce texte contient des propos qui ne sont pas acceptés.',
    duplicate: 'Cette suggestion a déjà été déposée.',
  },
} as const;

export const joinPage = {
  eyebrow: 'Rejoindre',
  title: 'Rejoindre l’U.N.I.O.N',
  intro:
    'Le groupe WhatsApp est le canal principal du mouvement. Vous pouvez y poser une question et suivre les annonces du bureau.',
  whatsapp: 'Rejoindre le groupe WhatsApp',
  unavailable:
    'Le lien d’invitation sera publié ici après validation par le bureau.',
  privacyTitle: 'Vos données',
  privacyText:
    'Le formulaire de ce site ne demande ni nom, ni e-mail, ni numéro. Rejoindre le groupe WhatsApp se fait dans WhatsApp, selon les règles de WhatsApp. Le site ne reçoit aucune donnée de membre.',
  minimalTitle: 'Une adhésion minimale',
  minimalText:
    'Aucune liste de membres n’est publiée. Aucune donnée personnelle n’est affichée sans accord écrit.',
  approvalNote:
    'Conseil au bureau : activez l’approbation des nouveaux participants dans WhatsApp pour limiter le spam.',
} as const;

export const documentsPage = {
  eyebrow: 'Documents',
  title: 'Documents',
  intro:
    'Les documents officiels du mouvement sont publiés après validation par le bureau.',
  items: [
    {
      title: 'Charte de l’U.N.I.O.N',
      status: 'Version imprimable disponible',
      action: 'Lire et imprimer la Charte',
      href: '/charte',
    },
    {
      title: 'Charte au format PDF',
      status: 'À fournir par le bureau',
      action: null,
      href: null,
    },
    {
      title: 'Statuts du mouvement',
      status: 'À fournir par le bureau',
      action: null,
      href: null,
    },
    {
      title: 'Rapport de présentation',
      status: 'À fournir par le bureau',
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
      a: 'L’Union Nationale pour l’Unité est un mouvement congolais en cours de constitution. Son but est de guérir le Congo du tribalisme par des actes.',
    },
    {
      q: 'Que veut dire le sigle ?',
      a: 'U pour Union, N pour Nationale, I O N pour l’unité. Aucune autre expansion n’est validée à ce jour.',
    },
    {
      q: 'Le mouvement est-il un parti ?',
      a: 'Le mouvement est en cours de constitution. Le dépôt du dossier est prévu, à confirmer par le bureau. Aucun statut officiel n’est affirmé sur ce site.',
    },
    {
      q: 'Comment rejoindre ?',
      a: 'Le groupe WhatsApp est le canal principal. Le lien d’invitation est fourni par un créateur. Le site ne demande aucune donnée personnelle.',
    },
    {
      q: 'Qu’est-ce que la Bourse des Frères ?',
      a: 'Chaque année, 12 jeunes, un par département, sont financés pour créer ensemble une activité, obligatoirement avec une personne d’un autre département.',
    },
    {
      q: 'Qu’est-ce que le Pacte de Poto-Poto ?',
      a: 'Un membre qui tient un discours tribal en public ou en ligne est suspendu 6 mois.',
    },
    {
      q: 'Comment fonctionne la boîte à suggestions ?',
      a: 'Toute personne peut déposer une suggestion sans compte. Après validation par le bureau, elle est publiée et chacun peut voter « Utile » ou « Pas utile ». Les votes sont indicatifs.',
    },
    {
      q: 'Mes données sont-elles conservées ?',
      a: site.privacyShort,
    },
  ],
} as const;

export const contactPage = {
  eyebrow: 'Contact',
  title: 'Contact',
  intro:
    'Les coordonnées officielles du bureau seront publiées après validation. En attendant, le groupe WhatsApp est le canal principal.',
  whatsapp: 'Rejoindre le groupe WhatsApp',
  unavailable:
    'Le lien d’invitation sera publié ici après validation par le bureau.',
  addressTitle: 'Siège',
  addressText: 'Adresse du siège à fournir par le bureau.',
  mediaTitle: 'Presse et corrections',
  mediaText:
    'Pour signaler une erreur dans un article, utilisez le canal officiel qui sera publié ici. Chaque correction est datée dans l’article.',
  noForm:
    'Le site ne propose pas de formulaire de contact qui collecterait des données personnelles.',
} as const;

export const legalPage = {
  eyebrow: 'Informations légales',
  title: 'Mentions légales',
  intro:
    'Cette page décrit l’état exact du mouvement et du site. Elle est mise à jour quand le bureau fournit une information vérifiée.',
  sections: [
    {
      title: 'Éditeur',
      body: [
        'U.N.I.O.N, Union Nationale pour l’Unité.',
        'Mouvement en cours de constitution. Le dépôt du dossier est prévu, à confirmer par le bureau.',
        'Aucun statut officiel, aucune reconnaissance et aucun agrément ne sont affirmés sur ce site.',
      ],
    },
    {
      title: 'Responsabilité éditoriale',
      body: [
        'Le journal « Infos de la semaine au Congo » est publié par l’U.N.I.O.N. Il ne s’agit pas d’un média indépendant.',
        'Les articles sont signés par le mouvement. Leurs sources sont citées quand elles existent.',
      ],
    },
    {
      title: 'Hébergement',
      body: [
        'Le nom de l’hébergeur et le nom de domaine seront publiés après validation par le bureau.',
      ],
    },
    {
      title: 'Propriété intellectuelle',
      body: [
        'Le logo est fourni par un créateur. Il est utilisé sans modification.',
        'Les textes du mouvement sont ceux validés par les trois créateurs.',
      ],
    },
  ],
} as const;

export const privacyPage = {
  eyebrow: 'Vie privée',
  title: 'Vie privée',
  intro:
    'Cette page décrit ce que le code fait réellement. Nous préférons une phrase exacte à une promesse large.',
  sections: [
    {
      title: 'Aucun compte, aucune coordonnée',
      body: [
        'La boîte à suggestions ne demande ni nom, ni e-mail, ni numéro de téléphone.',
        'Aucune colonne d’adresse IP, d’agent utilisateur, d’e-mail ou de téléphone n’existe dans les données des suggestions et des votes.',
        'Le site ne dépose aucun cookie d’analyse et n’utilise aucun traceur publicitaire.',
      ],
    },
    {
      title: 'Suggestions et votes dans cette version',
      body: [
        'Dans cette version, les suggestions, les votes et les articles du Studio sont conservés dans le stockage local de votre navigateur. Ils ne sont pas transmis à un serveur.',
        'Les articles publiés et les suggestions validées peuvent être placés dans un fichier JSON statique, sans adresse IP ni coordonnée. Ce fichier est lisible par tous.',
        'Sans serveur applicatif, une suggestion déposée reste dans le navigateur de son auteur. Le bureau ne la reçoit pas automatiquement. Pour une réception centralisée, un serveur ou un formulaire externe est nécessaire.',
        'Votre hébergeur peut conserver une trace technique temporaire de votre connexion. L’application ne la conserve pas.',
      ],
    },
    {
      title: 'Vote anonyme',
      body: [
        'Un jeton aléatoire est créé sur votre appareil pour éviter les votes multiples. Seule une empreinte de ce jeton est conservée par le dispositif de vote.',
        'L’anonymat total et le principe « une personne, une voix » ne peuvent pas être garantis ensemble. Les votes sont indicatifs.',
      ],
    },
    {
      title: 'Signalements et modération',
      body: [
        'Les suggestions sont lues avant publication. Les propos tribaux, les insultes, les données personnelles et les liens sont retirés ou refusés.',
        'Les suggestions archivées restent 90 jours dans le Studio pour l’audit, puis sont supprimées.',
      ],
    },
    {
      title: 'Vos droits',
      body: [
        'Comme aucune donnée personnelle n’est demandée, il n’y a pas de compte à supprimer.',
        'Pour toute question, utilisez le canal officiel qui sera publié sur la page Contact.',
      ],
    },
  ],
} as const;

export const accessibilityPage = {
  eyebrow: 'Accessibilité',
  title: 'Accessibilité',
  intro:
    'Le site vise le niveau WCAG 2.2 AA. Cette page décrit les moyens mis en place et les points à vérifier.',
  sections: [
    {
      title: 'Navigation',
      body: [
        'Toutes les pages sont utilisables au clavier. Un lien d’évitement mène directement au contenu.',
        'Les liens de navigation ont un fond visible au focus. Les cibles tactiles font au moins 44 pixels.',
      ],
    },
    {
      title: 'Lecture',
      body: [
        'Le texte courant est réglable avec les réglages du navigateur. La largeur de ligne est limitée à 62 caractères.',
        'Les couleurs ne sont jamais seules porteuses d’information : un libellé et une forme accompagnent chaque statut.',
      ],
    },
    {
      title: 'Mouvement',
      body: [
        'Le site respecte « réduire les animations ». Le bouton « Mode économie de données » réduit les animations et diffère les images.',
        'L’ouverture du site peut être passée. Elle est absente quand le mouvement est réduit ou quand le mode économie est actif.',
      ],
    },
    {
      title: 'Signaler un obstacle',
      body: [
        'Si une page vous empêche de lire ou d’agir, signalez-le au bureau par le canal officiel qui sera publié sur la page Contact.',
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
  subtitle: 'Édition du journal et modération des suggestions',
  gateTitle: 'Accès réservé',
  gateText:
    'Le Studio est réservé aux trois créateurs. Cette version de démonstration utilise un code local. En production, l’accès se fait par invitation, avec authentification forte et sessions\n  courtes.',
  codeLabel: 'Code d’accès',
  enter: 'Entrer dans le Studio',
  invalid: 'Code incorrect.',
  logout: 'Quitter le Studio',
  tabs: {
    journal: 'Journal',
    moderation: 'Modération',
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
    'L’image est redimensionnée et convertie dans le navigateur. Les métadonnées EXIF sont retirées.',
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
      'Une suggestion archivée reste 90 jours dans le Studio pour l’audit, puis est supprimée à l’ouverture suivante du Studio.',
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
    title: 'Édition sans serveur',
    intro:
      'Le site public lit un fichier JSON statique. Aucun serveur applicatif n’est nécessaire pour publier les articles et les suggestions validées.',
    steps: [
      'Créez ou modifiez les articles dans l’onglet Journal.',
      'Téléchargez l’édition publique.',
      'Remplacez public/data/edition.json par le fichier téléchargé.',
      'Redéployez le site ou remplacez le fichier sur l’hébergement.',
    ],
    publicTitle: 'Édition publique',
    publicText:
      'Contient les articles publiés et les suggestions publiques. Les brouillons, les votes locaux et le journal d’audit restent hors du fichier public.',
    backupTitle: 'Sauvegarde complète',
    backupText:
      'Contient tous les articles, les brouillons, les suggestions, les votes, les signalements, les réglages et le journal d’audit. À conserver hors du site public.',
    downloadPublic: 'Télécharger l’édition publique',
    downloadBackup: 'Télécharger la sauvegarde',
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
      'Sans serveur, les suggestions déposées par les visiteurs restent dans leur navigateur. Pour les recevoir, utilisez un formulaire externe ou un serveur.',
    localOnly:
      'Les modifications du Studio ne sont visibles par les autres visiteurs qu’après remplacement du fichier JSON et redéploiement.',
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
