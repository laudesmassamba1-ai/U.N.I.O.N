import { neon } from '@neondatabase/serverless';

/**
 * Pose les seuils initiaux dans `settings`, sans écraser une valeur existante.
 * Utilise le rôle Studio (seul à pouvoir écrire les réglages).
 */
const url = process.env.DATABASE_URL_STUDIO || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL_STUDIO absente. Rien n’a été modifié.');
  process.exit(1);
}

const defaults = {
  retainedVotes: 25,
  retainedShare: 65,
  archivedVotes: 25,
  archivedShare: 70,
  expiryDays: 60,
  retentionDays: 90,
  editionName: 'Édition de lancement',
};

const sql = neon(url);
await sql`
  insert into settings (key, value)
  values ('suggestions', ${JSON.stringify(defaults)}::jsonb)
  on conflict (key) do nothing
`;

const rows = await sql`select key from settings where key = 'suggestions'`;
console.log(
  rows.length === 1
    ? 'Réglages par défaut présents (25 votes, 65 %, 70 %, 60 jours, 90 jours).'
    : 'Réglages non écrits : vérifiez le rôle utilisé.',
);
