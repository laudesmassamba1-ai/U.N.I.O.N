# Design

## Principe

Le site est une page de papier blanc, réglée par des filets noirs. Le logo fourni donne les trois accents : vert, jaune, rouge. Le reste est encre et papier. Aucun dégradé, aucune ombre, aucun verre dépoli. Les angles sont droits, sauf les pastilles rondes du sceau et des tampons.

La « jonction » est le motif central : deux moitiés qui se rejoignent. On la retrouve dans le titre du héros, la carte des 12 départements, les scènes de la Charte et les tampons de statut.

## Couleurs

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `--ink` | `#0b0b0b` | Texte principal, filets forts |
| `--paper` | `#ffffff` | Fond par défaut |
| `--green` | `#328445` | Utile, retenu, validé |
| `--yellow` | `#f0d33a` | Attention, en discussion |
| `--red` | `#bc2425` | Non utile, fermé, erreur |
| `--paper-2` | `#f4f2ec` | Bandes secondaires |
| `--rule` | `#d9d6cc` | Filets fins |

La couleur n’est jamais seule : chaque statut porte un libellé et une forme (tampon, badge, barre).

## Typographies

- **Bitter** pour les titres, les chiffres et les citations. Graisse 800, interlignage serré, `text-wrap: balance`.
- **Public Sans** pour le texte courant et l’interface. 18 px de base, largeur de ligne limitée à 62 caractères.

## Grille et espace

- Largeur maximale : 1280 px.
- Marge latérale : `clamp(1rem, 4vw, 3rem)`.
- Filets de 1 px entre les blocs.
- Cibles tactiles d’au moins 44 px.
- En-tête fixe de 76 px.

## Composants

- `Section` : bande verticale avec filet supérieur.
- `SectionHead` : surtitre, titre, introduction, actions.
- `StatusBadge` / `StatusStamp` : statut lisible sans couleur.
- `VoteBar` : deux segments vert et rouge, pourcentages écrits.
- `ArticleCard` : numéro d’édition, nature, titre, résumé.
- `DepartmentMap` : tracés SVG réels, étiquettes et liste équivalente.
- `ButtonLink` : quatre variantes, toutes avec contour visible au focus.

## Accessibilité visuelle

- Contraste visé : WCAG 2.2 AA.
- Focus toujours visible, jamais supprimé.
- Lien d’évitement en premier.
- Mode sombre disponible par préférence d’affichage, sans inversion des accents.
- Impression : la Charte se détache en noir sur blanc, sans navigation ni boutons.

## Interdits

- Pas de photo décorative inventée.
- Pas de logo redessiné, recadré, filtré ou animé en déformation.
- Pas de carte stylisée qui inventerait des regroupements régionaux.
- Pas de témoignage, de chiffre ou de nom de membre non fourni.
