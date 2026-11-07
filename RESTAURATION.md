# Restaurer une sauvegarde

Objectif : remettre le site en ligne sur un projet Neon neuf **en moins d’une heure**. Une sauvegarde jamais restaurée n’est pas une sauvegarde : le workflow `restore-test.yml` le vérifie chaque mois.

## Ce qu’il faut avoir

- un ordinateur avec `age`, `psql` et `pg_restore` (version majeure identique au serveur) ;
- la clé privée `age` du fondateur, conservée hors ligne (gestionnaire de mots de passe et copie imprimée). La paire générée localement se trouve dans `data/backups/age/` (ignoré par Git) : déplacer `union.key` hors ligne après copie, ne jamais la versionner ;
- l’accès au Blob privé (`backups/`) et le jeton `BLOB_PRIVATE_READ_WRITE_TOKEN`, à garder hors du dépôt ;
- un compte Neon et un projet vide, dans la même région que l’ancien.

La clé privée ne doit jamais être copiée sur le serveur, dans GitHub, ni dans le dépôt.

## 1. Identifier la version du serveur

```bash
psql "$DATABASE_URL_BACKUP_RO" -Atc "SHOW server_version;"
```

Exemple : `16.4`. Installez la même version majeure du client.

## 2. Récupérer la dernière sauvegarde

Depuis la racine du dépôt, avec les dépendances installées (`pnpm install`) :

```bash
node --env-file-if-exists=.env.local scripts/blob-store.mjs list backups/ | sort | tail -5
node --env-file-if-exists=.env.local scripts/blob-store.mjs get "backups/union-AAAA-MM-JJ.dump.age" union-AAAA-MM-JJ.dump.age
node --env-file-if-exists=.env.local scripts/blob-store.mjs get "backups/union-AAAA-MM-JJ.counts.json" union-AAAA-MM-JJ.counts.json
sha256sum union-AAAA-MM-JJ.dump.age
```

Comparez l’empreinte à celle écrite dans `backup_log` (Studio → Santé, ou requête ci-dessous) :

```bash
psql "$DATABASE_URL_BACKUP_RO" -c \
  "SELECT created_at, size_bytes, sha256 FROM backup_log ORDER BY created_at DESC LIMIT 1;"
```

## 3. Déchiffrer

```bash
age --decrypt --identity ~/cle-age.txt \
  --output union.dump union-AAAA-MM-JJ.dump.age
pg_restore --list union.dump | head
```

Si `age` refuse la clé, arrêtez : ne demandez pas une nouvelle sauvegarde avant d’avoir compris pourquoi.

## 4. Créer le projet Neon

1. Créer un projet dans la région d’origine.
2. Récupérer la chaîne **pooler** (celle qui contient `-pooler`), pour l’API.
3. Créer un rôle lecture seule pour les sauvegardes.
4. Ne pas encore brancher Vercel : on restaure d’abord.

## 5. Restaurer

```bash
pg_restore --no-owner --no-privileges \
  --dbname "$DATABASE_URL_NEW" union.dump
```

En cas d’erreur sur un objet déjà présent, la restauration a probablement été lancée deux fois : repartez d’un projet vide.

## 6. Vérifier

```bash
psql "$DATABASE_URL_NEW" -c "
  SELECT 'articles' AS table, count(*) FROM articles
  UNION ALL SELECT 'suggestions', count(*) FROM suggestions
  UNION ALL SELECT 'votes', count(*) FROM suggestion_votes
  UNION ALL SELECT 'signalements', count(*) FROM reports
  UNION ALL SELECT 'audit', count(*) FROM audit_log;"
```

Comparez à `union-AAAA-MM-JJ.counts.json`. Un écart doit être expliqué avant la remise en ligne.

## 7. Remettre en ligne

1. Mettre à jour la chaîne de connexion côté Vercel (variable secrète).
2. Vérifier `GET /api/health` (sans base) puis `GET /api/health?deep=1` avec `HEALTH_SECRET`.
3. Vérifier `GET /api/v1/edition` : l’instantané doit se reconstruire une fois.
4. Publier un article de test dans le Studio, vérifier qu’il apparaît, puis le supprimer.
5. Faire un vote de test et vérifier les compteurs.
6. Déclencher `backup.yml` une fois et vérifier la ligne `backup_log`.
7. Noter l’incident et la date dans `PROGRESS.md`.

## Après la restauration

- Faire tourner les secrets (`STUDIO_SECRET`, `VOTE_SECRET`, `HEALTH_SECRET`) si la fuite est suspectée.
- Supprimer les fichiers déchiffrés de la machine (`shred -u union.dump`).
- Conserver la sauvegarde utilisée jusqu’à la prochaine sauvegarde vérifiée.
