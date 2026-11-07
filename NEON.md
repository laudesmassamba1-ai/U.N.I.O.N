# Neon : vivre sous le plan gratuit

Annexe de `SKILL.md`, section 5. La cible reste **PostgreSQL sur Neon (plan gratuit), site et API sur Vercel**. Ce document décrit ce qui est en place dans ce dépôt, ce qui est préparé et ce qui reste à brancher. Il ne prétend pas que la migration du moteur est faite : voir « État réel » plus bas.

## État réel

Le serveur livré ouvre **SQLite** (`server/db.ts`, `node:sqlite`), pas Neon. Les routes, le schéma et les tests sont écrits pour ce moteur. En conséquence :

- les limites de Neon ne s’appliquent pas encore, puisque aucune base Neon n’est appelée ;
- la couche de survie décrite ici est **déjà active** et testée, indépendamment du moteur ;
- le portage du pilote (`@neondatabase/serverless` + `drizzle-orm/neon-http`) et la traduction des requêtes restent le préalable à la mise en production sur Vercel. Aucun adaptateur PostgreSQL n’est écrit à ce jour.

Tant que ce portage n’est pas fait, `DATABASE_URL` n’est pas lue par le code. La déclarer ne change rien.

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

À faire lors du portage : chaîne « pooler », requêtes HTTP simples, WebSocket réservé aux transactions, `statement_timeout` et `idle_in_transaction_session_timeout` posés sur la session, région Vercel alignée sur Neon, trois rôles (API, Studio, lecture seule).

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

Le contrat `SnapshotSource` permet de changer de fournisseur sans toucher à l’API. `RemoteSnapshotSource` lit `SNAPSHOT_URL` et écrit `SNAPSHOT_WRITE_URL` (URL de put signée). Le choix R2 ou B2 n’est pas encore arrêté ; voir `DECISIONS.md`.

## 8. Sauvegarde

- `.github/workflows/backup.yml` : quotidien, `pg_dump` par le rôle lecture seule, chiffrement `age`, envoi S3, ligne dans `backup_log`.
- `.github/workflows/restore-test.yml` : mensuel, déchiffre avec une clé de test, restaure dans un PostgreSQL éphémère, compare les nombres de lignes au fichier `counts.json` de la sauvegarde.
- `RESTAURATION.md` décrit la restauration réelle, en moins d’une heure.
- La clé privée `age` n’est ni sur le serveur ni dans GitHub.

## 9. Écriture regroupée

`WRITE_MODE=direct|buffered` est documenté et réservé. **Aucune file n’est implémentée** : passer à `buffered` n’a aujourd’hui aucun effet. Le déclencheur est explicite : consommation au-delà de 60 % du quota avant le 20 du mois. La mise en œuvre prévue est une file Redis (Upstash) vidée toutes les 15 minutes, avec affichage immédiat du vote. Voir `BUDGET-NEON.md`.

## 10. Exploitation

- `ENV.md` : toutes les variables, où elles vivent, ce qui est public.
- Liste mensuelle : consommation de calcul, taille de la base, dernière sauvegarde, résultat du test de restauration, offres des fournisseurs.
- `A-FOURNIR.md` : comptes et clés à obtenir du fondateur.
