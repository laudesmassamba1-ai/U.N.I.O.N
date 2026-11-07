# Informations à fournir par le bureau

> **Rotation faite le 7 novembre 2026 :** le mot de passe `neondb_owner` exposé a été remplacé et `OWNER_PASSWORD_ROTATED=true` est posé dans `.env.local`. La nouvelle valeur reste dans `.env.local` ; lors de la création du projet Vercel, la reporter dans les variables du projet, jamais dans un fichier suivi.

Les éléments suivants ne peuvent pas être inventés. Tant qu’ils manquent, le site affiche un texte d’attente explicite.

## Identité et statut

- Nom du Président National, avec accord écrit de publication.
- Composition exacte du Bureau et postes effectivement pourvus.
- Statut juridique réel du mouvement et date de dépôt éventuelle.
- Texte des statuts, s’il existe.
- Adresse du siège, si elle est publique.
- Nom de domaine et hébergeur définitifs.
- Accès à une base PostgreSQL persistante pour la production, et validation du mode de déploiement.
- Rotation du mot de passe propriétaire Neon faite dans `.env.local` ; reste à la reporter dans les variables Vercel. Les chaînes limitées sont déjà déposées dans `.env.local`, jamais dans la conversation.
- Projet Vercel et domaine définitif.
- Secrets de production `STUDIO_SECRET` et `VOTE_SECRET`, générés puis conservés hors du dépôt.

## Programme

- Liste officielle des regroupements de départements, si le bureau en a adopté.
- Contenu détaillé du programme « 12-12 », s’il existe.
- Deux actions concrètes à présenter comme engagements mesurables.
- Textes des engagements déjà validés.

## Journal

- Première édition de « Infos de la semaine au Congo ».
- Règles de correction et de réponse aux signalements.
- Noms des personnes autorisées à publier dans le Studio et rôles associés.
- Sources et crédits des images de une.

## Carte de membre

- Boîtes du bureau qui reçoivent chaque dossier de membre (deux adresses annoncées, à confirmer par écrit).
- Compte d’un service d’envoi d’e-mails (API REST) et clé associée, conservée hors du dépôt.
- Domaine expéditeur vérifié et adresse d’expédition (`MEMBER_FROM_EMAIL`).
- Validation des mentions imprimées sur la carte (numéro, devise, statut du mouvement).
- Durée de conservation retenue par le bureau (douze mois dans le code actuel).
- Base légale et information des personnes pour ce traitement, à faire relire par un juriste congolais.
- Pour que le lien de messagerie apparaisse dans le site statique, définir `VITE_DOSSIER_EMAILS` (les deux adresses séparées par une virgule) dans Settings → Secrets and variables → Actions → Variables. Le workflow la transmet au build. Sans elle, seul le formulaire serveur reste actif.

## Langues

- Traductions validées en lingala et en kituba des pages essentielles.
- Choix de la langue par défaut et des libellés de navigation.

## Neon, stockage et sauvegardes

- Compte Neon et région choisie, identique à celle des fonctions Vercel.
- Chaîne de connexion « pooler » pour l’API, et chaîne d’un rôle **lecture seule** pour les sauvegardes.
- Projet Vercel et domaine définitif.
- Stockage Vercel Blob : `union-public` (instantané et images) et `union-backups` (dumps chiffrés) sont créés dans le projet Vercel, et le jeton privé est posé dans les secrets GitHub (`BLOB_PRIVATE_READ_WRITE_TOKEN`).
- Paires de clés `age` : la clé publique de production est dans `.env.local` et recopiée dans le secret GitHub `AGE_PUBLIC_KEY` ; sa clé privée `data/backups/age/union.key` doit être déplacée hors ligne (gestionnaire de mots de passe et copie imprimée), jamais dans le dépôt. Une paire de test dédiée est utilisée en plus : `AGE_TEST_PUBLIC_KEY` et `AGE_TEST_PRIVATE_KEY` sont des secrets GitHub, et chaque sauvegarde est chiffrée pour les deux destinataires. Le test mensuel ne peut donc jamais déchiffrer avec la clé de production.
- `HEALTH_SECRET` généré, et décision sur la publication de la consommation mensuelle.
- Confirmation du budget accepté (100 CU-heures) et du seuil de bascule vers l’écriture regroupée.

## Contact et diffusion

- Lien d’invitation au groupe WhatsApp.
- Canal officiel pour la presse et les corrections.
- Adresse e-mail ou postale de contact, si elle doit être publique.

## Documents

- Charte au format PDF.
- Statuts au format PDF, si publics.
- Rapport de présentation, si public.
- Toute pièce que le bureau souhaite publier.

## Décisions éditoriales

- Formulation validée de la devise et de la phrase de présentation.
- Accord sur la mention « mouvement en cours de constitution ».
- Validation des textes de la Charte, des engagements et de la FAQ.
- Relecture juridique des mentions légales et de la page Vie privée.
