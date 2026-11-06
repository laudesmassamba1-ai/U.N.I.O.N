# U.N.I.O.N, Union Nationale pour l’Unité

Site institutionnel de l’U.N.I.O.N, mouvement congolais en cours de constitution.
Il présente le mouvement, la Charte, le Bureau, les engagements, les 12 départements, le journal hebdomadaire **Infos de la semaine au Congo** et une boîte à suggestions anonyme.

## État de cette version

Cette version fonctionne **sans serveur applicatif**. Les articles du Studio, les suggestions et les votes sont modifiés dans le `localStorage` du navigateur, puis publiés dans un fichier JSON statique :

```text
public/data/edition.json
```

Le site public lit ce fichier. Un visiteur voit donc les articles publiés et les suggestions validées, sans base de données ni API.

Le Studio est protégé par une phrase de passe côté navigateur (`VITE_STUDIO_CODE`). Ce n’est **pas** une authentification de production.

Limites à connaître :

- les suggestions déposées par les visiteurs restent dans leur navigateur ;
- les votes sont locaux et ne sont pas partagés ;
- le fichier JSON doit être remplacé puis redéployé pour publier une modification ;
- une authentification réelle et un stockage partagé restent nécessaires pour une version entièrement collaborative.

Le détail se trouve dans [`EDITION.md`](EDITION.md).

Pour une mise en production complète, il faut au minimum :

- un stockage serveur partagé pour les suggestions et les votes ;
- une authentification réelle pour le Studio ;
- une politique de sauvegarde ;
- la validation par le bureau des textes, contacts, statuts et du lien WhatsApp.

## Lancer le projet

Prérequis : Node.js 20 ou plus récent, et pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Le site est servi sur `http://localhost:3000`.

## Variables d’environnement

| Variable | Rôle |
| --- | --- |
| `VITE_WHATSAPP_URL` | Lien d’invitation au groupe WhatsApp. Vide : les boutons WhatsApp sont masqués et un message d’attente s’affiche. |
| `VITE_STUDIO_CODE` | Phrase de passe de démonstration du Studio. Valeur par défaut : `union`. |

## Publier une édition

```bash
pnpm edition:publish /chemin/vers/edition.json
pnpm build
```

Ou remplacer `public/data/edition.json` par le fichier téléchargé depuis l’onglet **Édition** du Studio, puis relancer `pnpm build`.

## Vérifications

```bash
pnpm typecheck   # TypeScript
pnpm test        # tests unitaires
pnpm check       # typecheck + garde-fous + tests + build
```

Les garde-fous vérifient le logo, le vocabulaire interdit, la vie privée, le mouvement, le design et le fichier d’édition JSON.

## Structure

- `src/content/fr.ts` : textes visibles du site.
- `src/types.ts` : modèle de données.
- `src/lib/` : stockage local, édition JSON, dates, identifiants, chiffrement, suggestions, modération.
- `public/data/edition.json` : contenu public statique lu par le site.
- `scripts/edition.mjs` : vérification et publication du fichier d’édition.
- `src/components/` : composants publics et signature visuelle.
- `src/pages/` : pages publiques et Studio.
- `src/data/departments-geo.ts` : tracés SVG des 12 départements.
- `assets/logo-union.jpg` et `public/assets/logo-union.jpg` : logo fourni, utilisé sans modification.

## Crédits

- Logo : fourni par le fondateur, utilisé sans modification.
- Tracés des départements : geoBoundaries ADM1, République du Congo, licence CC BY 4.0.
- Typographies : Bitter et Public Sans, via Google Fonts.
