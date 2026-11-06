# État d’avancement

## Fait

- Application Vite + React + TypeScript sans dépendance UI externe.
- Design system complet dans `src/index.css` (papier, encre, trois accents, filets, tampons).
- Logo fourni, copié à l’identique, rendu par un seul composant.
- 12 pages publiques : accueil, mouvement, Charte, Bureau, engagements, départements, journal, article, suggestions, rejoindre, documents, FAQ, contact, mentions légales, vie privée, accessibilité, page introuvable.
- Journal hebdomadaire avec éditions, brouillons, publication, dépublication, archivage, suppression douce et restauration.
- Studio avec éditeur de blocs, image redimensionnée sans EXIF, sources, autosauvegarde, révisions, modération, réponses, fusion de doublons, seuils et journal d’audit.
- Boîte à suggestions anonyme : limite de 2 dépôts par heure, preuve de travail, modération, votes, signalements, statuts.
- Carte SVG réelle des 12 départements avec liste accessible.
- Motion : ouverture, titre de jonction, trois scènes, carte, Charte, tampons, votes.
- Réduction du mouvement, mode économie de données, styles d’impression, lien d’évitement.
- Service worker pour la lecture hors ligne d’une page de journal.
- Garde-fous automatisés : logo, vocabulaire, vie privée, mouvement, design.
- 30 tests unitaires.
- Documentation : `DESIGN.md`, `MOTION.md`, `DECISIONS.md`, `PROGRESS.md`, `A-FOURNIR.md`.

## Vérifications

```bash
pnpm check
```

La commande enchaîne le typecheck, les cinq garde-fous, les tests et le build.

## Limites connues

- Stockage local seulement : pas de partage entre visiteurs.
- Studio protégé côté navigateur seulement.
- Pas de traduction lingala ou kituba.
- Pas de PDF de Charte, pas de nom de Président, pas d’adresse de siège, pas de lien WhatsApp tant que le bureau ne les fournit pas.
- Pas d’image Open Graph propre à chaque article au-delà de l’image de une.
- Les textes juridiques doivent être relus par un professionnel avant publication.
- Les tracés geoBoundaries doivent conserver leur attribution CC BY 4.0.

## Prochaine étape technique

Remplacer l’adaptateur `localStorage` par une API serveur avec base de données, authentification du Studio et votes vérifiés côté serveur, sans changer les composants publics.
