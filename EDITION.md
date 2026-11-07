# Édition publique et secours statique

Le serveur est la source de vérité. `GET /api/v1/edition` sert les articles publiés, les suggestions validées, les réglages et la feuille de route. Le Studio écrit dans la base via l’API.

`public/data/edition.json` reste un fichier de secours en lecture seule. Il est utilisé quand l’API est indisponible, et peut être publié sur un hébergement statique.

## 1. Modifier le contenu

1. Ouvrir `/#/studio`.
2. Se connecter avec le code serveur (`STUDIO_SECRET`).
3. Créer, modifier, publier, archiver ou supprimer les articles.
4. Modérer les suggestions.
5. Ouvrir l’onglet **Édition** pour télécharger une copie de secours.

Chaque action est envoyée à l’API. Une modification n’est affichée comme réussie qu’après une réponse serveur.

## 2. Contenu de l’édition publique

L’édition contient :

- les articles publiés, sans brouillon et sans article supprimé ;
- les suggestions publiques validées, avec leurs réponses ;
- les réglages des seuils ;
- une révision et une date de mise à jour.

Elle ne contient pas :

- les brouillons ;
- les votes locaux ;
- les signalements locaux ;
- le journal d’audit ;
- l’historique des versions d’articles.

## 3. Télécharger le secours

Dans l’onglet **Édition**, cliquer sur **Télécharger l’édition publique**.

Pour remplacer le fichier de secours :

```bash
pnpm edition:publish /chemin/vers/edition.json
pnpm build
```

Le script vérifie le fichier, augmente la révision si nécessaire et écrit `public/data/edition.json`.

## 4. Déployer

Sur Vercel, `vercel.json` route `/api/*` vers `api/index.ts` et sert le reste depuis `dist/`.

Un hébergement purement statique peut servir `dist/` et `dist/data/edition.json`, mais il perd les suggestions partagées, les votes, la modération et le Studio serveur.

## 5. Télécharger une sauvegarde serveur

Dans l’onglet **Édition**, **Télécharger la sauvegarde** demande au serveur un instantané complet : tous les articles, brouillons, suggestions, votes, signalements, réglages et journal d’audit.

Le fichier produit est un export de sécurité. Il ne remplace pas la base et ne doit pas être publié sur le site public. La restauration d’une sauvegarde n’est pas encore exposée dans le Studio.

## 6. Révision

Chaque fichier contient un champ `revision`. Le serveur le calcule de façon déterministe à partir du contenu public et renvoie un ETag. Le fichier de secours applique une édition seulement si sa révision est supérieure à la révision locale déjà appliquée.

Le script `edition:publish` augmente la révision automatiquement. Si le fichier est remplacé à la main, il faut augmenter `revision` et `updatedAt` pour que les navigateurs déjà ouverts prennent la mise à jour.

## 7. Images

Deux choix dans le Studio :

- **Adresse de l’image** : placer le fichier dans `public/assets/` et utiliser `/assets/nom-du-fichier.jpg`.
- **Téléverser une image** : l’image est intégrée au JSON en base64. Le fichier devient plus lourd.

Pour un article publié, le texte alternatif, la légende et le crédit sont obligatoires.

## 8. Limites honnêtes

- SQLite convient au développement. Vercel exige un stockage partagé et persistant, par exemple PostgreSQL avec un adaptateur à écrire.
- Le fichier de secours est public. Ne jamais y placer de brouillon, de note interne, de donnée personnelle ou de journal d’audit.
- Le Studio dépend de `STUDIO_SECRET`. Sans ce secret, aucune session ne peut être ouverte.
- Les votes exigent `VOTE_SECRET` (32 caractères minimum) en production. Sans ce secret, l’API refuse les votes avec un code 503 au lieu de perdre l’unicité des empreintes.
- Les votes et signalements ne sont partagés entre visiteurs que lorsque l’API et la base sont disponibles.

## 9. Vérifier le fichier

```bash
pnpm edition:check
pnpm check
```

`pnpm check` vérifie le typecheck, les garde-fous, l’édition JSON, les tests et le build.
