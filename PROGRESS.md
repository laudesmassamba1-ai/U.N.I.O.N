# État d’avancement

## Fait

- Application Vite + React + TypeScript sans dépendance UI externe.
- Design system complet dans `src/index.css` (papier, encre, trois accents, filets, tampons).
- Logo fourni, copié à l’identique, rendu par un seul composant.
- Pages publiques : accueil, mouvement, Charte, Bureau, engagements, départements, journal, article, suggestions, rejoindre, documents, FAQ, contact, mentions légales, vie privée, accessibilité, page introuvable.
- Journal hebdomadaire avec éditions, brouillons, publication, dépublication, archivage, suppression douce et restauration.
- Studio avec éditeur de blocs, image redimensionnée sans EXIF, sources, autosauvegarde, révisions, modération, réponses, fusion de doublons, seuils et journal d’audit.
- Boîte à suggestions anonyme : limite de 2 dépôts par heure, preuve de travail, modération, votes, signalements, statuts.
- Neon : schéma Drizzle PostgreSQL (14 tables, contraintes de longueur, de statut, de vote et d’instantané unique), migration `drizzle/0000_union.sql` et seed `0001_seed.sql` appliqués sur le projet de Londres, rôles `app_public`/`app_studio`/`backup_ro` créés, preuve réelle repassée.
- Sécurité : `check-secrets` ajouté à `pnpm check`, rappel de rotation du mot de passe `neondb_owner`, `.neon/` et `neon.ts` ignorés.
- Reste : report de la rotation dans Vercel, premier essai des sauvegardes et vérification du déploiement.
- Lectures publiques : `/api/v1/edition` sert un instantané en mémoire ou sur stockage, avec cache CDN long, ETag et repli sur l’ancien instantané quand la base ne répond pas. Un test vérifie que dix lectures ne construisent qu’une fois.
- Écritures : validation et preuve de calcul avant tout accès à la base, trois essais sur réveil, quota traité séparément avec dix minutes de répit, réponse 503 explicite et brouillon local conservé.
- Exploitation : `GET /api/health` sans base, `?deep=1` protégé par `HEALTH_SECRET`, `GET /api/v1/studio/health` pour la taille de la base et la dernière sauvegarde, `POST /api/v1/warm` limité à dix minutes.
- Sauvegardes : `backup_log`, workflow quotidien chiffré et workflow mensuel de restauration ; `backup_ro` peut journaliser une sauvegarde sans accéder au reste. Base de production PostgreSQL sur Neon configurée ; déploiement Vercel à faire.
- Exploitation : cron quotidien `/api/cron/daily` protégé par `CRON_SECRET`, routage Vercel `api/index.ts`, écriture directe de l’instantané vers Vercel Blob.
- Typographie : une seule requête de polices, graisse 800 de Bitter réellement chargée, chiffres tabulaires, veuves évitées, thème appliqué avant le premier rendu.
- Interface : filet de lecture en haut de page, en-têtes d’ancrage sous l’en-tête fixe, focus rendu au contenu après chaque navigation.
- Mouvement : tampons posés à l’entrée dans le champ, joint de la jonction piloté par le défilement, réponses au survol réservées aux pointeurs fins et coupées en mouvement réduit.
- Logique : feuille de route triée par ordre d’étape, thème initial qui suit le système, département vide traité comme absent dans le dossier de membre.
- Carte de membre : page en trois étapes, formulaire public, dossier envoyé au bureau par e-mail, carte envoyée au membre, conservation douze mois, aucune donnée publiée, aucune confirmation sans envoi réel.
- Second chemin sans serveur : un lien de messagerie pré-rempli vers les deux boîtes du bureau, utile quand le site est servi en statique. Le site indique qu’il ne peut pas vérifier cet envoi.
- Carte SVG réelle des 12 départements avec liste accessible.
- Motion : ouverture, titre de jonction, trois scènes, carte, Charte, tampons, votes.
- Réduction du mouvement, mode économie de données, styles d’impression, lien d’évitement.
- Service worker pour la lecture hors ligne d’une page de journal et du fichier d’édition.
- Serveur HTTP : API `/api/v1`, PGlite en développement, PostgreSQL sur Neon en production, sessions signées, preuve de travail, validation, audit.
- Studio connecté au serveur : session `STUDIO_SECRET`, articles, modération, réglages et audit passent par l’API.
- Édition publique servie par l’API avec révision déterministe, ETag et cache de 60 secondes.
- Aperçus `/p/:slug` et `/api/v1/share/:slug` avec Open Graph et image absolue configurable par `VITE_SITE_URL`.
- Édition statique de secours : `public/data/edition.json`, commande `pnpm edition:publish`.
- Sauvegarde complète générée par le serveur via `GET /api/v1/studio/backup`.
- Champ d’adresse d’image dans le Studio pour alléger le JSON.
- Garde-fous automatisés : logo, vocabulaire, vie privée, routes, mouvement, design, édition JSON.
- 85 tests unitaires et de cycle de vie serveur.
- Audit DOM automatisé aux largeurs 375, 768 et 1440 px : aucun débordement horizontal détecté.
- Documentation : `DESIGN.md`, `MOTION.md`, `EDITION.md`, `DECISIONS.md`, `PROGRESS.md`, `A-FOURNIR.md`, `NEON.md`, `ENV.md`.

## Vérifications

```bash
pnpm check
```

La commande enchaîne le typecheck, les garde-fous, les tests et le build.

## Limites connues

- PGlite couvre le développement et les tests ; la production utilise PostgreSQL sur Neon et les routes serverless sont déployées sur Vercel.
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

Vérifier l’écriture de l’instantané sur Vercel Blob, ajouter le jeton privé aux secrets GitHub, lancer un premier test de sauvegarde, remplacer le mot de passe propriétaire, puis relire les textes avec le bureau.
