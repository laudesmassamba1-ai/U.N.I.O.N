# U.N.I.O.N, Union Nationale pour l’Unité

Site institutionnel de l’U.N.I.O.N, mouvement congolais en cours de constitution.
Il présente le mouvement, la Charte, le Bureau, les engagements, les 12 départements, le journal hebdomadaire **Infos de la semaine au Congo** et une boîte à suggestions anonyme.

## Architecture

Le site public est une application Vite + React. Un serveur HTTP fournit l’API `/api/v1` et sert la même application en développement.

- Les articles, suggestions, votes, signalements, réglages et entrées d’audit sont lus et écrits côté serveur.
- Le Studio utilise une session signée HMAC, un cookie `HttpOnly` `SameSite=Strict` et `SESSION_SECRET` (ancien nom accepté : `STUDIO_SECRET`).
- `public/data/edition.json` reste un secours statique en lecture seule lorsque l’API est indisponible.
- En développement et en test, la base est PGlite (PostgreSQL en mémoire ou dans `data/pglite`). En production, le serveur utilise PostgreSQL sur Neon avec des rôles limités.

Le serveur est la source de vérité : une suggestion, un vote ou une publication n’est confirmé à l’écran qu’après une réponse serveur réussie.

## Lancer le projet

Prérequis : Node.js 22 ou plus récent, et pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Le site est servi sur `http://localhost:3000`.

## Variables d’environnement

| Variable | Rôle |
| --- | --- |
| `SESSION_SECRET` | Obligatoire pour ouvrir une session Studio. 32 caractères minimum. `STUDIO_SECRET` reste accepté (16 caractères minimum). Ne jamais exposer avec un préfixe `VITE_`. |
| `VOTE_HMAC_SECRET` | Secret HMAC des empreintes de vote. 32 caractères minimum. `VOTE_SECRET` reste accepté. Obligatoire en production, sinon l’API refuse les votes avec un code 503. |
| `DATABASE_URL_APP`, `DATABASE_URL_STUDIO`, `DATABASE_URL_BACKUP_RO` | Chaînes Neon limitées par rôle. `DATABASE_URL` propriétaire sert uniquement aux migrations. |
| `PGLITE_PATH` | Chemin de la base PGlite locale. Par défaut `data/pglite` ; `PGLITE_MEMORY=1` force la mémoire. |
| `VITE_SITE_URL` | Origine publique absolue, sans slash final. Sert à l’image Open Graph et au partage. Remplacer par le domaine définitif. |
| `VITE_WHATSAPP_URL` | Lien d’invitation au groupe WhatsApp. Vide : les boutons sont masqués. |
| `VITE_UNION_EMAIL` | Adresse e-mail publique, publiée uniquement si elle a été validée. |
| `VITE_DRAFT_NOTES` | Affiche les notes internes de travail. `false` en production. |
| `VITE_BASE` | Chemin de base de l’application. `/` par défaut. |

Générer un secret local :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API

```text
GET  /api/v1/edition
POST /api/v1/suggestions
POST /api/v1/votes
POST /api/v1/reports
GET  /api/v1/roadmap
POST /api/v1/studio/login
POST /api/v1/studio/logout
GET  /api/v1/studio/me
GET  /api/v1/studio/articles
POST /api/v1/studio/articles
PUT  /api/v1/studio/articles/:id
GET  /api/v1/studio/suggestions
POST /api/v1/studio/suggestions/:id/moderate
GET  /api/v1/studio/settings
PUT  /api/v1/studio/settings
GET  /api/v1/studio/audit
GET  /api/v1/studio/backup
GET  /p/:slug
GET  /api/v1/share/:slug
```

Les routes Studio exigent la session serveur. Les suggestions anonymes exigent une preuve de travail, sont limitées à deux dépôts par heure et restent invisibles publiquement avant modération.

## Déploiement

Le fichier `vercel.json` route toutes les requêtes `/api/*` vers `api/[...path].ts` et planifie `/api/cron/daily`. La production utilise PostgreSQL sur Neon, avec `DATABASE_URL_APP` pour l’API et `DATABASE_URL_STUDIO` pour le Studio. Le déploiement Vercel et la création des seaux R2 restent à faire.

Il faut aussi fournir `SESSION_SECRET`, `VOTE_HMAC_SECRET` et un stockage d’objets. Sans cela, le site peut être consulté, mais le Studio et les écritures ne doivent pas être considérés comme prêts pour la production.

## Vérifications

```bash
pnpm typecheck   # TypeScript
pnpm test        # tests unitaires et cycle de vie serveur
pnpm check       # typecheck + garde-fous + tests + build
```

Les garde-fous vérifient le logo, le vocabulaire interdit, la vie privée, les routes sociales, le mouvement, le design et le fichier d’édition JSON.

## Structure

- `src/content/fr.ts` : textes visibles du site.
- `src/content/notes-internes.ts` : notes d’équipe, masquées par défaut.
- `src/types.ts` : modèle de données.
- `src/lib/` : API cliente, stockage local, édition JSON, dates, identifiants, chiffrement, suggestions, modération.
- `server/` : API, accès PostgreSQL/PGlite, sessions, validation.
- `api/index.ts` : point d’entrée Vercel.
- `public/data/edition.json` : secours statique en lecture seule.
- `scripts/` : garde-fous et publication de l’édition de secours.
- `src/components/` : composants publics et signature visuelle.
- `src/pages/` : pages publiques et Studio.
- `src/data/departments-geo.ts` : tracés SVG des 12 départements.
- `assets/logo-union.jpg` et `public/assets/logo-union.jpg` : logo fourni, utilisé sans modification.

## Crédits

- Logo : fourni par le fondateur, utilisé sans modification.
- Tracés des départements : geoBoundaries ADM1, République du Congo, licence CC BY 4.0.
- Typographies : Bitter et Public Sans, via Google Fonts.
