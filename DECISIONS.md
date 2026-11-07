# Décisions

## 1. Serveur applicatif

Le cahier des charges initial décrivait Next.js, pnpm et PostgreSQL. L’application est construite avec Vite + React et un serveur HTTP Node. Le serveur est la source de vérité pour l’édition, les suggestions, les votes, les signalements et le Studio.

Le déploiement Vercel est préparé avec `vercel.json` et `api/index.ts`. La base actuelle est SQLite pour le développement. Aucun adaptateur PostgreSQL n’est encore écrit : Vercel n’offre pas de stockage SQLite persistant.

## 2. Pas de contenu inventé

Aucun article, nom de membre, chiffre, statut légal, groupe ethnique ou attaque n’a été ajouté. Les pages qui dépendent d’une information non fournie affichent un texte d’attente explicite. Le mouvement est décrit comme « en cours de constitution ».

## 3. Logo intangible

Le logo fourni est copié à l’identique dans `assets/logo-union.jpg` et `public/assets/logo-union.jpg`. Il n’est rendu que par `src/components/Logo.tsx`. Aucune retouche, aucun filtre, aucune déformation.

## 4. Géographie réelle

La carte utilise les tracés ADM1 de geoBoundaries pour les 12 départements du Congo, sous licence CC BY 4.0. Aucun regroupement Nord/Sud n’est dessiné, car le bureau n’a pas fourni de liste officielle.

## 5. Suggestions anonymes

Le modèle ne contient ni nom, ni e-mail, ni téléphone, ni adresse IP, ni agent utilisateur. Un jeton aléatoire local sert à éviter les votes multiples ; seule une empreinte HMAC est conservée. En production, `VOTE_SECRET` (32 caractères minimum) est obligatoire : sans lui, l’API refuse les votes avec un code 503 plutôt que de perdre l’unicité des empreintes. L’anonymat total et le principe « une personne, une voix » ne peuvent pas être garantis ensemble, et l’interface le dit.

## 6. Modération avant publication

Toute suggestion est déposée avec le statut `pending`. Elle n’apparaît publiquement qu’après validation dans le Studio. Les liens, coordonnées, ethnonymes, insultes et doublons sont refusés à la saisie, puis relus par un humain.

## 7. Seuils réglables

Les seuils par défaut sont ceux du cahier des charges : 25 votes et 65 % d’avis utiles pour retenir, 25 votes et 70 % d’avis inutiles pour archiver, 60 jours avant expiration, 90 jours de conservation après archivage. Ils sont modifiables dans le Studio et stockés côté serveur.

## 8. Studio protégé côté serveur

L’ouverture du Studio exige `STUDIO_SECRET` (16 caractères minimum). Le serveur vérifie le code en temps constant, émet une session signée HMAC valable deux heures et la place dans un cookie `HttpOnly` `SameSite=Strict`. Le code n’est plus stocké côté client et le Studio ne confirme rien sans réponse serveur.

## 9. Service worker limité

Le service worker met en cache les navigations publiques et la page explicitement mise hors ligne depuis un article. Il ignore le Studio. Il ne remplace pas une stratégie de cache serveur.

## 10. Textes français seulement

Les traductions en lingala et en kituba ne sont pas fournies. Aucune traduction automatique n’a été inventée. La Charte mentionne l’usage des deux langues dans les réunions, sans prétendre que le site est déjà bilingue.

## 11. Édition de secours

L’API sert l’édition publique avec un ETag et un cache de 60 secondes. `public/data/edition.json` reste un fichier de secours en lecture seule, produit par le Studio. Il ne remplace pas la base serveur et ne doit contenir ni brouillon, ni vote, ni signalement, ni journal d’audit. La sauvegarde complète est un export serveur téléchargeable ; sa restauration n’est pas exposée dans le Studio.

Une édition publique conserve les suggestions locales encore en attente ainsi que les votes et signalements locaux lors d’une fusion. Le serveur reste prioritaire dès qu’il répond.
