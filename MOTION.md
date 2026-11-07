# Mouvement

## Règles générales

- Le défilement reste natif. Aucun verrou de molette, aucun `touchmove` détourné.
- Toute animation est coupée par `prefers-reduced-motion: reduce`.
- Le bouton « Mode économie de données » coupe aussi les animations et diffère les images.
- Une animation ne cache jamais une information nécessaire.
- Les scènes ne se déclenchent qu’une fois par session quand elles sont liées à l’ouverture.

## Ouverture

Durée maximale : 2 700 ms. Deux moitiés de papier s’écartent, le logo apparaît au centre, le mot U.N.I.O.N se pose, puis l’ensemble s’efface. Un bouton « Passer » est toujours visible. L’ouverture ne se joue pas si le mouvement est réduit, si le mode économie est actif ou si elle a déjà été vue dans la session.

Fichier : `src/components/Opening.tsx`.

## Titre de la jonction

Le titre du héros passe de « Un Congo divisé mendie » à « Un Congo uni travaille » selon la position de défilement. La transformation est pilotée par la position, sans animation autonome. Le texte final reste lisible même sans mouvement.

Fichier : `src/components/JunctionTitle.tsx`.

## Trois scènes

Trois blocs collants, dans l’ordre :

1. **Guérir** le Congo du tribalisme.
2. **Prouver** que l’union est possible.
3. **Travailler** ensemble.

Chaque scène tient sur une hauteur de défilement, avec un titre, un texte court et un repère visuel. En mouvement réduit, les blocs deviennent statiques et s’empilent normalement.

Le troisième repère montre deux pièces réellement différentes : à gauche une plaque chanfreinée à deux tenons de profondeurs inégales, à droite une pièce à bord incliné, encoche en V et deux mortaises. Les deux tracés partagent le même joint, si bien qu’à l’arrivée il n’y a ni jour ni recouvrement. La ligne de joint se trace en vert quand l’assemblage est complet.

Fichier : `src/components/ThreeScenes.tsx`.

## Carte des départements

Les 12 tracés se dessinent au moment où la carte entre dans le champ. Le dessin est progressif mais jamais bloquant. La liste textuelle des départements reste disponible sans SVG.

Fichier : `src/components/DepartmentMap.tsx`.

## Charte

Les deux moitiés de la Charte se rejoignent à l’entrée dans le champ. Le texte est ensuite fixe. À l’impression, les moitiés sont déjà jointes.

## Tampons et votes

Les tampons de statut apparaissent avec une légère rotation, comme un cachet posé sur du papier. Les barres de vote se remplissent en respectant la largeur réelle des pourcentages. Aucun des deux ne dépend du survol.

Chaque tampon porte `data-reveal` : il reste invisible jusqu’à son entrée dans le champ, puis joue `stamp-in` (420 ms, échelle 1,08 puis 1, rotation −1,2° puis 0). En mouvement réduit ou en mode économie, l’animation est coupée et le tampon est affiché d’emblée.

## Ouverture d’un article

Le titre de la carte du journal et celui de l’article portent le même nom d’élément partagé : à l’ouverture comme au retour, il glisse de l’un à l’autre avec un fondu court, sans rebond. Si l’API n’existe pas, en mouvement réduit ou en mode économie de données, la navigation est immédiate et sans transition.

Fichiers : `src/components/Link.tsx`, `src/lib/hooks.ts` (`navigateWithTransition`), `src/lib/articles.ts` (`articleViewTransitionName`).

## Filet de lecture

Un filet vert de 3 px, `ReadProgress`, se remplit en haut de la page selon la position de défilement. Il est piloté par la position, sans animation temporelle, ne capte aucun clic et n’apparaît qu’entre le début et la fin de la page. Il est masqué à l’impression.

Le joint vert du titre de la jonction grandit aussi avec le défilement : sa hauteur va de 55 % à 100 % quand les deux moitiés se rejoignent, sans mouvement autonome.

## Réglages

- Préférence système : `prefers-reduced-motion`.
- Préférence site : mode économie de données, mémorisé dans le navigateur.
- Classe appliquée : `reduce-motion` ou `data-saver` sur `<html>`.

Fichier : `src/lib/hooks.ts`.
