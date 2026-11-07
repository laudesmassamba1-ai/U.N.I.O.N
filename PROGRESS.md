# État d’avancement

## Fait

- Application Vite + React + TypeScript sans dépendance UI externe.
- Design system complet dans `src/index.css` (papier, encre, trois accents, filets, tampons).
- Logo fourni, copié à l’identique, rendu par un seul composant.
- Pages publiques : accueil, mouvement, Charte, Bureau, engagements, départements, journal, article, suggestions, rejoindre, documents, FAQ, contact, mentions légales, vie privée, accessibilité, page introuvable.
- Journal hebdomadaire avec éditions, brouillons, publication, dépublication, archivage, suppression douce et restauration.
- Studio avec éditeur de blocs, image redimensionnée sans EXIF, sources, autosauvegarde, révisions, modération, réponses, fusion de doublons, seuils et journal d’audit.
- Boîte à suggestions anonyme : limite de 2 dépôts par heure, preuve de travail, modération, votes, signalements, statuts.
- Carte de membre : page en trois étapes, formulaire public, dossier envoyé au bureau par e-mail, carte envoyée au membre, conservation douze mois, aucune donnée publiée, aucune confirmation sans envoi réel.
- Second chemin sans serveur : un lien de messagerie pré-rempli vers les deux boîtes du bureau, utile quand le site est servi en statique. Le site indique qu’il ne peut pas vérifier cet envoi.
- Carte SVG réelle des 12 départements avec liste accessible.
- Motion : ouverture, titre de jonction, trois scènes, carte, Charte, tampons, votes.
- Réduction du mouvement, mode économie de données, styles d’impression, lien d’évitement.
- Service worker pour la lecture hors ligne d’une page de journal et du fichier d’édition.
- Serveur HTTP : API `/api/v1`, SQLite de développement, sessions signées, preuve de travail, validation, audit.
- Studio connecté au serveur : session `STUDIO_SECRET`, articles, modération, réglages et audit passent par l’API.
- Édition publique servie par l’API avec révision déterministe, ETag et cache de 60 secondes.
- Aperçus `/p/:slug` et `/api/v1/share/:slug` avec Open Graph et image absolue configurable par `VITE_SITE_URL`.
- Édition statique de secours : `public/data/edition.json`, commande `pnpm edition:publish`.
- Sauvegarde complète générée par le serveur via `GET /api/v1/studio/backup`.
- Champ d’adresse d’image dans le Studio pour alléger le JSON.
- Garde-fous automatisés : logo, vocabulaire, vie privée, routes, mouvement, design, édition JSON.
- 44 tests unitaires et de cycle de vie serveur.
- Audit DOM automatisé aux largeurs 375, 768 et 1440 px : aucun débordement horizontal détecté.
- Documentation : `DESIGN.md`, `MOTION.md`, `EDITION.md`, `DECISIONS.md`, `PROGRESS.md`, `A-FOURNIR.md`.

## Vérifications

```bash
pnpm check
```

La commande enchaîne le typecheck, les garde-fous, les tests et le build.

## Limites connues

- SQLite est adapté au développement, pas à Vercel en production : aucun adaptateur PostgreSQL n’est écrit.
- L’envoi des cartes exige `MAIL_API_KEY`, `MEMBER_FROM_EMAIL` et `MEMBER_DOSSIER_EMAILS` côté serveur. Sans clé, le service répond « pas encore ouvert » au lieu de confirmer un envoi.
- Pas encore de liste des membres dans le Studio ni de renvoi de carte depuis l’interface : le bureau retrouve chaque dossier dans sa boîte e-mail.
- Le fichier JSON de secours doit être remplacé puis redéployé pour publier sans API.
- Pas de traduction lingala ou kituba.
- Pas de PDF de Charte, pas de nom de Président, pas d’adresse de siège, pas de lien WhatsApp tant que le bureau ne les fournit pas.
- Les textes juridiques doivent être relus par un professionnel avant publication.
- Les tracés geoBoundaries doivent conserver leur attribution CC BY 4.0.
- La vérification visuelle humaine des captures reste à faire ; l’audit automatisé des débordements, des titres et des cibles tactiles a été exécuté.
- Le secret `VOTE_SECRET` est obligatoire en production : sans lui, les votes sont refusés avec un code 503.

## Prochaine étape technique

Ajouter un adaptateur PostgreSQL et des migrations, puis relire les textes et les états vides avec le bureau avant une mise en production complète.
