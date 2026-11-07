# Neon : vivre sous le plan gratuit

Annexe de `SKILL.md`, section 5. La cible reste **PostgreSQL sur Neon (plan gratuit), site et API sur Vercel**. Ce document décrit ce qui est en place dans ce dépôt et ce qui reste à faire ; le runtime PostgreSQL est branché, voir « État réel » plus bas.

## État réel

Le runtime serveur sait ouvrir **PostgreSQL sur Neon** (`lib/server/db.ts`) et retombe sur PGlite en développement/test. La connexion est opérationnelle via les chaînes présentes dans `.env.local` ; le CLI Neon, lui, n’est pas authentifié.

- `lib/server/schema.ts` décrit les 14 tables PostgreSQL de référence, `members` comprise ;
- `drizzle/0000_union.sql` est la migration appliquée, avec les contraintes de texte, de statut, de valeur de vote et la ligne unique d’instantané ;
- `drizzle/0001_seed.sql` pose les réglages et la feuille de route initiaux ;
- `tests/neon-schema.test.ts` applique cette migration dans PGlite et vérifie les contraintes, sans consommer de calcul Neon ;
- `lib/server/db.ts` choisit la connexion selon le rôle (`DATABASE_URL_APP`, `DATABASE_URL_STUDIO`, `DATABASE_URL_BACKUP_RO`) et partage une seule base PGlite en développement/test ;
- `lib/server/retry.ts` porte les trois essais ;
- `scripts/db-roles.sql` et `scripts/db-roles.mjs` créent les rôles limités sans afficher leurs mots de passe ;
- `scripts/prove-neon.ts` exécute la preuve réelle.

État vérifié le 7 novembre 2026 : migration appliquée, 14 tables présentes, rôles `app_public`, `app_studio` et `backup_ro` créés, seed appliqué (1 réglage, 3 étapes de feuille de route), preuve réelle repassée (dépôt, publication, deux votes, instantané, nettoyage). Le mot de passe propriétaire, collé dans une conversation, doit être remplacé avant toute mise en ligne, puis `OWNER_PASSWORD_ROTATED=true` posé dans `.env.local`. Restent à faire : rotation du mot de passe propriétaire, déploiement Vercel, variables d’environnement, stockage d’objets et sauvegardes.

## 1. Limites visées

| Limite | Valeur | Réponse dans le code |
| --- | --- | --- |
| Endormissement | 5 min sans activité | instantané public, aucune lecture ne réveille la base |
| Calcul | 100 CU-heures par mois | écritures seules, réveil à l’intention, budget dans `BUDGET-NEON.md` |
| Stockage | 1 Go | aucune image en base, panneau de santé, alertes 70/85 %, blocage doux 95 % |
| Historique | court | workflow de sauvegarde chiffrée et test de restauration |
| Deux fournisseurs | Vercel + Neon | variables séparées, sauvegarde hors Vercel, documentation `RESTAURATION.md` |

## 2. Lire sans la base

`GET /api/v1/edition` ne construit plus la réponse à chaque visite.

1. `server/snapshot.ts` garde l’édition en mémoire (`SnapshotState`).
2. Sur une instance froide, `server/snapshot-source.ts` lit d’abord l’objet public (`SNAPSHOT_URL`) ou le fichier local (`SNAPSHOT_PATH`).
3. Seule une absence totale d’instantané déclenche une reconstruction.
4. La réponse porte `Cache-Control: public, max-age=60, s-maxage=600, stale-while-revalidate=86400`, un ETag stable et `X-Snapshot-Updated-At`.
5. Une reconstruction concurrente est mutualisée : dix requêtes simultanées ne produisent qu’une construction.

## 3. Écrire avec la base, sans la réveiller pour rien

- La validation et la preuve de calcul passent **avant** tout accès à la base pour les suggestions, votes et signalements.
- Un dépôt valide déclenche une reconstruction opportuniste : `refreshPublicEdition()` ne reconstruit que si l’instantané a plus de dix minutes, et la base est déjà éveillée.
- Une publication, modification, modération ou un changement de réglage dans le Studio force la reconstruction.
- La réponse d’un vote contient déjà les compteurs à jour : la page n’a pas besoin de relire la base.
- `POST /api/v1/warm` réveille la base à l’intention, au plus une fois toutes les dix minutes pour l’instance, après une saisie réelle (20 caractères minimum) et une preuve de calcul. Le navigateur l’appelle une seule fois quand la personne commence à écrire.
- Aucun sondage : le site relit l’édition à l’ouverture, jamais en boucle.

## 4. Connexion et requêtes

`server/resilience.ts` fixe le contrat, identique quel que soit le pilote :

- trois essais au maximum : 0 ms, 700 ms, 1 500 ms ;
- budget total de 8 secondes, délai d’instruction de 5 secondes (`withTimeout`) ;
- aucune nouvelle tentative sur une validation, une contrainte ou un quota ;
- quota épuisé : dix minutes de répit puis mode dégradé ;
- classification explicite : `validation`, `constraint`, `quota`, `wake`, `unknown`.

En place : chaîne « pooler » pour l’API et le Studio, connexion directe réservée aux migrations, requêtes HTTP, WebSocket pour les transactions, `statement_timeout` et `idle_in_transaction_session_timeout`, région `lhr1`, rôles `app_public` / `app_studio` / `backup_ro`. Reste : déploiement Vercel, stockage d’objets et rotation du mot de passe propriétaire.

## 5. Mode dégradé

- Les lectures publiques continuent de servir l’instantané, même ancien. La réponse porte `X-Snapshot-Origin` et l’âge.
- Une écriture impossible renvoie 503 avec `code: db_quota` ou `db_unavailable`, le message prévu et `Retry-After`. Le texte saisi reste dans le formulaire **et** dans un brouillon local (`union.suggestion.draft.v1`).
- Aucun message ne dit « envoyé » sans écriture confirmée : c’était déjà le contrat des suggestions et des cartes.
- La sonde `GET /api/health` ne touche jamais la base. `?deep=1` exige `HEALTH_SECRET` (en-tête `Authorization: Bearer` ou paramètre `key`) et fait un `SELECT 1` sous 5 secondes.

## 6. Rester sous 1 Go

- Aucune image en base : la table `media` ne garde que l’adresse, le texte alternatif et le crédit.
- Pas de données de limitation de fréquence en base : elles vivent en mémoire (`server/security.ts`).
- `GET /api/v1/studio/health` renvoie la taille de la base, le pourcentage du 1 Go, l’âge de l’instantané, la dernière sauvegarde et les alertes. `writesBlocked` passe à vrai à 95 %.
- À faire : réduction d’image dans le navigateur (1 600 px, WebP/AVIF), envoi direct par URL signée, purge quotidienne des révisions au-delà de 20, des suggestions archivées après 90 jours et du journal d’audit au-delà de 12 mois.

## 7. Stockage d’objets

Deux emplacements logiques, jamais versionnés dans le dépôt :

- `public/` : instantané `edition.json`, images servies par CDN ;
- `backups/` : dumps chiffrés, accès privé.

Fournisseur retenu : **Vercel Blob**, inclus dans le plan Hobby gratuit et déjà relié au projet. Deux Blob : `union-public` (instantané `edition.json`, images ; accès public) et `union-backups` (privé, dumps chiffrés). Les deux ont été créés en région `lhr1` via le CLI Vercel.

Le contrat `SnapshotSource` permet de changer de fournisseur sans toucher à l’API. `RemoteSnapshotSource` lit `SNAPSHOT_URL` et écrit directement dans le Blob public via `lib/server/objectStore.ts` (`BLOB_READ_WRITE_TOKEN` ou `BLOB_PUBLIC_READ_WRITE_TOKEN`) ; `SNAPSHOT_WRITE_URL` ne sert que de repli. Voir `DECISIONS.md`.

## 8. Sauvegarde

- `.github/workflows/backup.yml` : quotidien, `pg_dump` par le rôle lecture seule, chiffrement `age`, envoi vers le Blob privé Vercel, ligne dans `backup_log`.
- `.github/workflows/restore-test.yml` : mensuel, déchiffre avec une clé de test, restaure dans un PostgreSQL éphémère, compare les nombres de lignes au fichier `counts.json` de la sauvegarde.
- `RESTAURATION.md` décrit la restauration réelle, en moins d’une heure.
- La clé privée `age` n’est ni sur le serveur ni dans GitHub.

## 9. Écriture regroupée

`WRITE_MODE=direct|buffered` est documenté et réservé. **Aucune file n’est implémentée** : passer à `buffered` n’a aujourd’hui aucun effet. Le déclencheur est explicite : consommation au-delà de 60 % du quota avant le 20 du mois. La mise en œuvre prévue est une file Redis (Upstash) vidée toutes les 15 minutes, avec affichage immédiat du vote. Voir `BUDGET-NEON.md`.

## 9 bis. Ce qui reste à faire après la connexion

1. ~~Connexion Neon et dépôt des chaînes dans `.env.local`.~~ Fait.
2. ~~`pnpm db:migrate` avec `DATABASE_URL`.~~ Fait.
3. ~~`pnpm db:roles` puis `pnpm db:seed`.~~ Fait.
4. ~~`pnpm prove:neon`.~~ Fait.
5. Déployer Vercel : `api/[...path].ts` sert toutes les routes `/api/*` ; `/api/cron/daily` est protégé par `CRON_SECRET` et planifié dans `vercel.json`.
6. ~~Créer les Blob `union-public` et `union-backups`.~~ Fait via le CLI Vercel ; renseigner `SNAPSHOT_URL`.
7. Le secret GitHub `DATABASE_URL_BACKUP_RO` et `AGE_PUBLIC_KEY` sont posés ; il reste `BLOB_PRIVATE_READ_WRITE_TOKEN` et le premier essai du workflow.
8. ~~Remplacer le mot de passe `neondb_owner` exposé dans `.env.local`.~~ Fait ; le reporter dans Vercel à la création du projet.

## 10. Exploitation

- `ENV.md` : toutes les variables, où elles vivent, ce qui est public.
- Liste mensuelle : consommation de calcul, taille de la base, dernière sauvegarde, résultat du test de restauration, offres des fournisseurs.
- `A-FOURNIR.md` : comptes et clés à obtenir du fondateur.
