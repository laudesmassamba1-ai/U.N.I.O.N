# Variables d’environnement

Trois lieux seulement : le navigateur au build, l’API sur Vercel, les workflows GitHub. Aucun secret ne porte le préfixe `VITE_` : tout ce qui est préfixé est publié dans le JavaScript du site.

## Navigateur (build)

| Variable | Rôle | Public |
| --- | --- | --- |
| `VITE_SITE_URL` | origine absolue pour les aperçus Open Graph | oui |
| `VITE_BASE` | chemin de base (`/U.N.I.O.N/` sur Pages) | oui |
| `VITE_WHATSAPP_URL` | lien d’invitation au groupe | oui |
| `VITE_UNION_EMAIL` | adresse publique du mouvement, si validée | oui |
| `VITE_DRAFT_NOTES` | affichage des notes internes | oui |
| `VITE_DOSSIER_EMAILS` | boîtes du bureau pour le lien `mailto:` | oui, à n’utiliser que si le bureau accepte leur publication |

## API (Vercel, secrets)

| Variable | Rôle | Secret |
| --- | --- | --- |
| `STUDIO_SECRET` | ouverture du Studio, 16 caractères minimum | oui |
| `VOTE_SECRET` | empreinte HMAC des votes, 32 caractères minimum | oui |
| `HEALTH_SECRET` | sonde profonde `?deep=1` | oui |
| `MEMBER_DOSSIER_EMAILS` | boîtes qui reçoivent les dossiers de membre | oui |
| `MAIL_API_KEY` | clé du service d’envoi | oui |
| `MAIL_API_URL` | point d’envoi (Resend par défaut) | non |
| `MEMBER_FROM_EMAIL` | expéditeur vérifié | non |
| `DATABASE_URL` | connexion directe du propriétaire, migrations seulement | oui |
| `DATABASE_URL_POOLED` | pooler du propriétaire, dépannage local | oui |
| `DATABASE_URL_APP` | pooler, rôle `app_public`, API publique | oui |
| `DATABASE_URL_STUDIO` | pooler, rôle `app_studio`, Studio | oui |
| `DATABASE_URL_BACKUP_RO` | direct, rôle `backup_ro`, GitHub Actions seulement | oui |
| `VOTE_HMAC_SECRET` | empreinte des jetons de vote | oui |
| `SESSION_SECRET` | signature des sessions du Studio | oui |
| `REVALIDATE_SECRET`, `CRON_SECRET` | appels internes et tâche planifiée | oui |
| `OBJECT_STORE_*` | endpoint, seau, clés, URL publique | oui |
| `BACKUP_AGE_PUBLIC_KEY` | chiffrement des sauvegardes | non (clé publique) |
| `PUBLIC_SITE_URL` | URL absolue du site | non |
| `DATABASE_URL_READONLY` | ancien nom du rôle lecture seule (workflows actuels) | oui |
| `SNAPSHOT_URL` | objet public de l’instantané | non |
| `SNAPSHOT_WRITE_URL` | URL de put signée pour publier l’instantané | oui |
| `SNAPSHOT_PATH` | fichier local de développement | non |
| `HEALTH_SECRET` | voir ci-dessus | oui |
| `WRITE_MODE` | `direct` (défaut) ou `buffered` (réservé) | non |

## Workflows GitHub (Secrets and variables)

| Nom | Rôle |
| --- | --- |
| `DATABASE_URL_READONLY` | dump et comptage des lignes |
| `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET` | destination des sauvegardes |
| `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY` | accès au compartiment privé |
| `AGE_PUBLIC_KEY` | chiffrement des sauvegardes |
| `AGE_TEST_PRIVATE_KEY` | test mensuel de restauration, clé de test uniquement |
| `HEALTH_SECRET` (variable) | contrôle de santé après déploiement, facultatif |
| `VITE_DOSSIER_EMAILS` (variable) | transmise au build Pages |

## Règles

- Un secret se génère (`openssl rand -hex 32`), ne se réutilise pas entre services et ne se colle jamais dans une conversation.
- La clé privée `age` n’existe ni sur Vercel, ni dans GitHub, ni dans le dépôt : seulement hors ligne chez le fondateur.
- Toute variable ajoutée ici doit aussi figurer dans `.env.example`, sans valeur.
- `scripts/check-privacy.mjs` échoue si un `VITE_` contient un secret connu ou si une adresse réelle apparaît dans le code publié.
