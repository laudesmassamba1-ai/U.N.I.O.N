# Décisions

## 1. Serveur applicatif

Le cahier des charges initial décrivait Next.js, pnpm et PostgreSQL. L’application est construite avec Vite + React et un serveur HTTP Node. Le serveur est la source de vérité pour l’édition, les suggestions, les votes, les signalements et le Studio.

Le déploiement Vercel est préparé avec `vercel.json` et `api/index.ts` : une seule fonction sert toutes les routes `/api/*`. La production utilise PostgreSQL sur Neon, avec PGlite en développement et en test et des rôles `app_public` / `app_studio` / `backup_ro`. Le déploiement Vercel et la tâche quotidienne restent à faire.

## 2. Pas de contenu inventé

Aucun article, nom de membre, chiffre, statut légal, groupe ethnique ou attaque n’a été ajouté. Les pages qui dépendent d’une information non fournie affichent un texte d’attente explicite. Le mouvement est décrit comme « en cours de constitution ».

## 3. Logo intangible

Le logo fourni est copié à l’identique dans `assets/logo-union.jpg` et `public/assets/logo-union.jpg`. Il n’est rendu que par `src/components/Logo.tsx`. Aucune retouche, aucun filtre, aucune déformation.

## 4. Géographie réelle

La carte utilise les tracés ADM1 de geoBoundaries pour les 12 départements du Congo, sous licence CC BY 4.0. Aucun regroupement Nord/Sud n’est dessiné, car le bureau n’a pas fourni de liste officielle.

## 5. Suggestions anonymes

Le modèle ne contient ni nom, ni e-mail, ni téléphone, ni adresse IP, ni agent utilisateur. Un jeton aléatoire local sert à éviter les votes multiples ; seule une empreinte HMAC est conservée. En production, `VOTE_HMAC_SECRET` (32 caractères minimum ; `VOTE_SECRET` reste accepté) est obligatoire : sans lui, l’API refuse les votes avec un code 503 plutôt que de perdre l’unicité des empreintes. L’anonymat total et le principe « une personne, une voix » ne peuvent pas être garantis ensemble, et l’interface le dit.

## 6. Modération avant publication

Toute suggestion est déposée avec le statut `pending`. Elle n’apparaît publiquement qu’après validation dans le Studio. Les liens, coordonnées, ethnonymes, insultes et doublons sont refusés à la saisie, puis relus par un humain.

## 7. Seuils réglables

Les seuils par défaut sont ceux du cahier des charges : 25 votes et 65 % d’avis utiles pour retenir, 25 votes et 70 % d’avis inutiles pour archiver, 60 jours avant expiration, 90 jours de conservation après archivage. Ils sont modifiables dans le Studio et stockés côté serveur.

## 8. Studio protégé côté serveur

L’ouverture du Studio exige `SESSION_SECRET` (32 caractères minimum ; `STUDIO_SECRET` reste accepté à 16 caractères). Le serveur vérifie le code en temps constant, émet une session signée HMAC valable deux heures et la place dans un cookie `HttpOnly` `SameSite=Strict`. Le code n’est plus stocké côté client et le Studio ne confirme rien sans réponse serveur.

## 9. Service worker limité

Le service worker met en cache les navigations publiques et la page explicitement mise hors ligne depuis un article. Il ignore le Studio. Il ne remplace pas une stratégie de cache serveur.

## 10. Textes français seulement

Les traductions en lingala et en kituba ne sont pas fournies. Aucune traduction automatique n’a été inventée. La Charte mentionne l’usage des deux langues dans les réunions, sans prétendre que le site est déjà bilingue.

## 11. Édition de secours

L’API sert l’édition publique avec un ETag et un cache de 60 secondes. `public/data/edition.json` reste un fichier de secours en lecture seule, produit par le Studio. Il ne remplace pas la base serveur et ne doit contenir ni brouillon, ni vote, ni signalement, ni journal d’audit. La sauvegarde complète est un export serveur téléchargeable ; sa restauration n’est pas exposée dans le Studio.

Une édition publique conserve les suggestions locales encore en attente ainsi que les votes et signalements locaux lors d’une fusion. Le serveur reste prioritaire dès qu’il répond.

## 12. Lectures sans base, écritures avec

- L’édition publique est servie depuis un instantané (`server/snapshot.ts`) : mémoire, puis stockage d’objets, puis reconstruction unique si rien n’existe. Les lectures publiques ne réveillent pas la base.
- Cache CDN : `max-age=60`, `s-maxage=600`, `stale-while-revalidate=86400`, ETag stable.
- Reconstruction uniquement après une écriture (si l’instantané a plus de dix minutes), sur action du Studio (forcée) ou si l’instantané manque. Aucune tâche fréquente.
- Réveil à l’intention (`POST /api/v1/warm`) limité à une fois par dix minutes, après saisie réelle et preuve de calcul. Son pire cas consomme trop de calcul : un plafond quotidien reste à ajouter avant un trafic continu.
- Trois essais sur erreur de réveil (0, 700, 1 500 ms) dans un budget de 8 s ; jamais sur validation ou contrainte. Quota épuisé : dix minutes de répit et réponse 503 avec le texte conservé localement.
- La sonde courte `/api/health` ne touche jamais la base ; `?deep=1` exige `HEALTH_SECRET`.
- Le panneau de santé du Studio lit la taille de la base, l’âge de l’instantané et la dernière sauvegarde (`backup_log`), avec alertes à 70 %, 85 % et blocage doux à 95 %.
- Le runtime serveur utilise PostgreSQL sur Neon quand `DATABASE_URL_APP`/`DATABASE_URL_STUDIO` sont présentes, et une seule base PGlite partagée en développement/test. Le schéma Drizzle, la migration, le seed et les trois rôles sont appliqués sur la base Neon de Londres ; la preuve réelle est repassée. Le mot de passe propriétaire exposé a été remplacé et `OWNER_PASSWORD_ROTATED=true` est posé localement ; il reste à le reporter dans Vercel. Le cron quotidien et le routage catch-all sont écrits, mais le déploiement Vercel n’est pas encore fait.
- Sauvegardes : workflow quotidien chiffré par `age` vers un stockage privé, rétention 8 quotidiennes et 3 mensuelles, test de restauration mensuel dans un PostgreSQL éphémère. La clé privée reste hors ligne.

## 13. Stockage d’objets : Vercel Blob

Vercel Blob est retenu : il est inclus dans le plan Hobby gratuit, ne demande aucun compte supplémentaire et le CLI Vercel déjà authentifié crée les deux Blob. `union-public` sert l’instantané et les images ; `union-backups` reste privé et ne contient que des dumps chiffrés par `age`. R2 a été écarté parce que son activation exige un moyen de paiement dans le tableau de bord Cloudflare ; B2 aurait demandé une inscription et une vérification d’e-mail. En local, le Blob public utilise `BLOB_PUBLIC_READ_WRITE_TOKEN` et le privé `BLOB_PRIVATE_READ_WRITE_TOKEN` ; sur Vercel, le public s’appelle `BLOB_READ_WRITE_TOKEN`. La clé privée `age` est générée localement, ignorée par Git, puis conservée hors ligne ; seule la clé publique va dans GitHub.

## Carte de membre par e-mail

- La demande de carte est un service distinct de l’adhésion : l’adhésion reste le groupe WhatsApp.
- Le dossier part au bureau avant la carte. Si le dossier au bureau échoue, rien n’est enregistré et rien n’est promis.
- Si le dossier part mais que la carte échoue, l’écran dit « dossier transmis », jamais « carte envoyée ».
- Les adresses du bureau vivent dans `MEMBER_DOSSIER_EMAILS`, côté serveur, hors du dépôt public.
- Aucune donnée de membre n’entre dans l’édition publique ; conservation douze mois maximum.
