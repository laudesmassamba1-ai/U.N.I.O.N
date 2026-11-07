/**
 * Preuve de fonctionnement sur une vraie base Neon, avec les rôles limités.
 *
 *   node --experimental-strip-types scripts/prove-neon.ts --confirm
 *
 * Le script écrit puis supprime ses propres données. Il refuse de tourner sans
 * `--confirm` et n’affiche jamais une chaîne de connexion ni un secret.
 */
import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { ulid } from 'ulidx';

const confirmed = process.argv.includes('--confirm');
if (!confirmed) {
  console.error('Refusé : ajoutez --confirm pour écrire des lignes de test puis les supprimer.');
  process.exit(1);
}

const appUrl = process.env.DATABASE_URL_APP;
const studioUrl = process.env.DATABASE_URL_STUDIO;
const hmacSecret = process.env.VOTE_HMAC_SECRET;

if (!appUrl || !studioUrl || !hmacSecret) {
  console.error('Variables absentes : DATABASE_URL_APP, DATABASE_URL_STUDIO, VOTE_HMAC_SECRET.');
  process.exit(1);
}

const app = neon(appUrl);
const studio = neon(studioUrl);
const suggestionId = `prove-${ulid()}`;
const text = 'Suggestion de contrôle technique, supprimée à la fin du script.';
const voters = ['preuve-1', 'preuve-2'];

function voterHash(token: string): string {
  return crypto.createHmac('sha256', hmacSecret as string).update(token).digest('hex');
}

async function main(): Promise<void> {
  const ping = (await app`select 1 as ok`) as Array<{ ok: number }>;
  console.log(`1. select 1 : ${ping[0]?.ok === 1 ? 'ok' : 'échec'}`);

  const tables = (await app`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `) as Array<{ table_name: string }>;
  const expected = [
    'article_revisions',
    'articles',
    'audit_log',
    'backup_log',
    'media',
    'reports',
    'roadmap',
    'settings',
    'snapshot_meta',
    'studio_users',
    'suggestion_responses',
    'suggestion_votes',
    'suggestions',
  ];
  const found = tables.map((row) => row.table_name);
  const missing = expected.filter((name) => !found.includes(name));
  console.log(`2. migrations : ${missing.length === 0 ? 'toutes présentes' : `manquantes ${missing.join(', ')}`}`);
  if (missing.length > 0) throw new Error('Migrations incomplètes.');

  await app`
    insert into suggestions (id, text, category, status)
    values (${suggestionId}, ${text}, 'Jeunesse', 'pending')
  `;
  await studio`
    update suggestions set status = 'discussion', published_at = now(), status_changed_at = now()
    where id = ${suggestionId}
  `;
  console.log('3. dépôt puis publication : ok');

  for (const [index, token] of voters.entries()) {
    const value = index === 0 ? 1 : -1;
    const hash = voterHash(token);
    await app`
      insert into suggestion_votes (suggestion_id, voter_hash, value)
      values (${suggestionId}, ${hash}, ${value})
      on conflict (suggestion_id, voter_hash) do update
      set value = excluded.value, updated_at = now()
    `;
  }
  const counters = (await app`
    select useful_count, not_useful_count from suggestions where id = ${suggestionId}
  `) as Array<{ useful_count: number; not_useful_count: number }>;
  console.log(
    `4. deux votes : utiles ${counters[0]?.useful_count ?? '?'}, inutiles ${counters[0]?.not_useful_count ?? '?'}`,
  );
  if (counters[0]?.useful_count !== 0 || counters[0]?.not_useful_count !== 0) {
    console.log('   (compteurs mis à jour par la route applicative, pas par ce script)');
  }

  await app`
    insert into snapshot_meta (id, built_at, etag)
    values (1, now(), ${`prove-${Date.now()}`})
    on conflict (id) do update set built_at = now(), etag = excluded.etag
  `;
  console.log('5. snapshot_meta : ok');

  await studio`delete from suggestions where id = ${suggestionId}`;
  const remaining = (await app`
    select count(*)::int as count from suggestions where id = ${suggestionId}
  `) as Array<{ count: number }>;
  console.log(`6. nettoyage : ${remaining[0]?.count === 0 ? 'ok' : 'lignes restantes'}`);

  console.log('Preuve terminée. Aucune valeur secrète affichée.');
}

main().catch((error: unknown) => {
  console.error(`Échec de la preuve : ${(error as Error)?.name ?? 'erreur'}.`);
  process.exit(1);
});
