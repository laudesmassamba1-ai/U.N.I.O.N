# Publier sans serveur

Le site peut fonctionner sur un hébergement statique. Aucun serveur applicatif, aucune base de données et aucun compte ne sont nécessaires pour lire le site.

Le contenu public est lu dans un seul fichier :

```text
public/data/edition.json
```

Après le build, ce fichier est copié dans :

```text
dist/data/edition.json
```

## 1. Modifier le contenu

1. Ouvrir `/#/studio`.
2. Entrer dans le Studio avec le code local.
3. Créer, modifier, publier, archiver ou supprimer les articles.
4. Modérer les suggestions.
5. Ouvrir l’onglet **Édition**.

## 2. Télécharger l’édition publique

Dans l’onglet **Édition**, cliquer sur **Télécharger l’édition publique**.

Le fichier `edition.json` contient :

- les articles publiés, sans brouillon et sans article supprimé ;
- les suggestions publiques validées ;
- les réglages des seuils ;
- une révision et une date de mise à jour.

Il ne contient pas :

- les brouillons ;
- les votes locaux ;
- les signalements locaux ;
- le journal d’audit ;
- l’historique des versions d’articles.

## 3. Remplacer le fichier

Deux méthodes possibles.

### Méthode locale

Remplacer `public/data/edition.json` par le fichier téléchargé, puis relancer :

```bash
pnpm build
```

Le dossier `dist/` contient la nouvelle version du site.

### Méthode par script

```bash
pnpm edition:publish /chemin/vers/edition.json
pnpm build
```

Le script vérifie le fichier, augmente la révision si nécessaire et écrit `public/data/edition.json`.

### Méthode directe sur l’hébergement

Si l’hébergement permet de remplacer un fichier par FTP ou par un gestionnaire de fichiers, remplacer directement :

```text
dist/data/edition.json
```

Le site lit ce fichier à chaque chargement avec une priorité réseau, puis utilise la copie hors ligne si le réseau échoue.

## 4. Déployer

Déposer le contenu du dossier `dist/` sur l’hébergement statique :

- Netlify ;
- Vercel ;
- GitHub Pages ;
- Cloudflare Pages ;
- un serveur web classique avec FTP.

Le site utilise des adresses avec `#`, donc aucune règle de réécriture serveur n’est nécessaire pour les pages.

## 5. Importer une sauvegarde

Dans l’onglet **Édition** :

- **Télécharger la sauvegarde** produit un fichier `union-sauvegarde.json` avec tous les articles, brouillons, suggestions, votes, signalements, réglages et journal d’audit.
- **Choisir un fichier JSON** importe un fichier `union-edition` ou `union-backup`.

Un fichier `union-backup` remplace toutes les données locales. Il ne doit pas être publié sur le site public.

Un fichier `union-edition` remplace les articles et les suggestions publiques, mais conserve les suggestions locales encore en attente.

## 6. Révision

Chaque fichier contient un champ `revision`. Le site applique le fichier publié seulement si sa révision est supérieure à la révision locale déjà appliquée.

Le script `edition:publish` augmente la révision automatiquement. Si le fichier est remplacé à la main, il faut augmenter `revision` et `updatedAt` pour que les navigateurs déjà ouverts prennent la mise à jour.

## 7. Images

Deux choix dans le Studio :

- **Adresse de l’image** : placer le fichier dans `public/assets/` et utiliser `/assets/nom-du-fichier.jpg`. Le fichier JSON reste petit.
- **Téléverser une image** : l’image est intégrée au JSON en base64. Cela fonctionne, mais le fichier devient lourd.

Pour un article publié, le texte alternatif, la légende et le crédit sont obligatoires.

## 8. Limites honnêtes

- Les suggestions déposées par les visiteurs restent dans leur navigateur. Le bureau ne les reçoit pas automatiquement.
- Les votes sont locaux. Ils ne sont pas partagés entre visiteurs.
- Le code du Studio est un rideau de démonstration. Toute personne qui possède le code peut modifier les données locales de son navigateur.
- Le fichier `edition.json` est public. Ne jamais y placer de brouillon, de note interne, de donnée personnelle ou de journal d’audit.
- Pour recevoir les suggestions et les votes de tous les visiteurs, un serveur ou un formulaire externe reste nécessaire.

## 9. Vérifier le fichier

```bash
pnpm edition:check
pnpm check
```

`pnpm check` vérifie le typecheck, les garde-fous, l’édition JSON, les tests et le build.
