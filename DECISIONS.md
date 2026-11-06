# Décisions

## 1. Applications clientes plutôt que serveur

Le cahier des charges initial décrivait Next.js, pnpm et PostgreSQL. L’environnement disponible est une application Vite + React sans serveur ni base de données. Le site a été construit comme une application cliente avec un adaptateur de stockage local.

Conséquence : les articles, suggestions et votes ne sont pas partagés entre les visiteurs. La page Vie privée et le README l’indiquent explicitement.

## 2. Pas de contenu inventé

Aucun article, nom de membre, chiffre, statut légal, groupe ethnique ou attaque n’a été ajouté. Les pages qui dépendent d’une information non fournie affichent un texte d’attente explicite. Le mouvement est décrit comme « en cours de constitution ».

## 3. Logo intangible

Le logo fourni est copié à l’identique dans `assets/logo-union.jpg` et `public/assets/logo-union.jpg`. Il n’est rendu que par `src/components/Logo.tsx`. Aucune retouche, aucun filtre, aucune déformation.

## 4. Géographie réelle

La carte utilise les tracés ADM1 de geoBoundaries pour les 12 départements du Congo, sous licence CC BY 4.0. Aucun regroupement Nord/Sud n’est dessiné, car le bureau n’a pas fourni de liste officielle.

## 5. Suggestions anonymes

Le modèle ne contient ni nom, ni e-mail, ni téléphone, ni adresse IP, ni agent utilisateur. Un jeton aléatoire local sert à éviter les votes multiples ; seule une empreinte HMAC est conservée. L’anonymat total et le principe « une personne, une voix » ne peuvent pas être garantis ensemble, et l’interface le dit.

## 6. Modération avant publication

Toute suggestion est déposée avec le statut `pending`. Elle n’apparaît publiquement qu’après validation dans le Studio. Les liens, coordonnées, ethnonymes, insultes et doublons sont refusés à la saisie, puis relus par un humain.

## 7. Seuils réglables

Les seuils par défaut sont ceux du cahier des charges : 25 votes et 65 % d’avis utiles pour retenir, 25 votes et 70 % d’avis inutiles pour archiver, 60 jours avant expiration, 90 jours de conservation après archivage. Ils sont modifiables dans le Studio.

## 8. Studio non sécurisé

L’accès au Studio repose sur `VITE_STUDIO_CODE`, une phrase de passe côté navigateur. C’est un rideau de démonstration, pas une authentification. Une mise en production exige un serveur, une session signée et des rôles vérifiés côté serveur.

## 9. Service worker limité

Le service worker ne met en cache que les navigations publiques et la page explicitement mise hors ligne depuis un article. Il ignore le Studio. Il ne remplace pas une stratégie de cache serveur.

## 10. Textes français seulement

Les traductions en lingala et en kituba ne sont pas fournies. Aucune traduction automatique n’a été inventée. La Charte mentionne l’usage des deux langues dans les réunions, sans prétendre que le site est déjà bilingue.
