# Budget de calcul Neon

Toutes les valeurs sont des **estimations**, pas des mesures : aucune base Neon n’est branchée. Hypothèses de travail à vérifier dans la console et à corriger dès la première semaine.

## Hypothèses

- Plan gratuit : 100 CU-heures par mois et par projet.
- Coût minimum d’un calcul réveillé : 0,25 CU (hypothèse basse, à confirmer).
- Un réveil dure au moins 5 minutes après la dernière activité : c’est le prix plancher d’une salve d’écriture.
- Une salve d’écriture dure quelques dizaines de millisecondes ; elle est négligeable devant les 5 minutes.
- Une base réveillée en permanence : 24 × 30 = 720 heures, soit 720 × 0,25 = **180 CU-heures par mois**, au-delà du quota.
- Les lectures publiques ne touchent pas la base : elles coûtent 0 CU-heure.

## Scénarios

### (a) 20 écritures par jour, bien espacées

Chaque écriture réveille la base pour 5 minutes, puis elle se rendort.

- 20 × 5 = 100 minutes réveillées par jour ;
- 100 × 30 = 3 000 minutes par mois, soit 50 heures ;
- 50 × 0,25 = **12,5 CU-heures par mois**, environ 12 % du quota.

Les reconstructions d’instantané après écriture se font pendant ces fenêtres : elles n’ajoutent pas de réveil.

### (b) Une écriture toutes les 4 minutes, en continu

La base ne se rendort jamais entre deux écritures.

- 720 heures réveillées ;
- **180 CU-heures par mois**, hors budget.

### (c) Mode regroupé, votes par lots de 15 minutes

Les votes sont mis en file et écrits toutes les 15 minutes ; une fenêtre de 5 minutes par quart d’heure.

- 8 heures réveillées par jour, 240 heures par mois ;
- 240 × 0,25 = **60 CU-heures par mois**, environ 60 % du quota.

Ce mode n’est pas implémenté. `WRITE_MODE=buffered` est réservé.

## Autres postes

| Poste | Calcul | CU-heures par mois |
| --- | --- | --- |
| Tâche quotidienne (purges, instantané) | 5 min/jour → 2,5 h | 0,6 |
| Sauvegarde quotidienne | 1 min/jour → 0,5 h | 0,1 |
| Réveil à l’intention, 10 sessions par jour | 50 min/jour → 25 h | 6,3 |
| Réveil à l’intention, pire cas (1 toutes les 10 min, 24 h/24) | 12 h/jour → 360 h | 90 |

Le pire cas du réveil à l’intention est un vrai risque : le garde-fou limité à dix minutes ne suffit pas si le site reçoit du trafic en continu. Deux garde-fous restent à ajouter avant une mise en production à fort trafic : plafond quotidien du réveil (par exemple 24 par jour) et désactivation du réveil si la consommation mesurée dépasse 60 % du quota.

## Règle de décision

Si, **avant le 20 du mois**, la consommation dépasse 60 % du quota :

1. désactiver le réveil à l’intention ;
2. passer les votes en mode regroupé (à implémenter) ;
3. vérifier que la tâche quotidienne et les sauvegardes restent les seules écritures planifiées ;
4. noter la mesure dans ce fichier, avec la date et la valeur lue dans la console.

## Coût des tests et de l’intégration continue

Les tests utilisent SQLite en mémoire (`node:sqlite`), pas Neon. Aucune heure de calcul n’est consommée par `pnpm test` ni par GitHub Actions. PGlite n’est pas installé à ce jour.
