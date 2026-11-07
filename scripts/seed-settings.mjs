import { spawnSync } from 'node:child_process';
import path from 'node:path';

/**
 * Applique le seed SQL (réglages + feuille de route) avec la connexion
 * propriétaire. `ON CONFLICT DO NOTHING` rend l’opération rejouable.
 * Aucun secret n’est affiché.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL absente. Rien n’a été modifié.');
  process.exit(1);
}

const result = spawnSync(
  'psql',
  [url, '-v', 'ON_ERROR_STOP=1', '-f', path.join(process.cwd(), 'drizzle', '0001_seed.sql')],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
);

if (result.status !== 0) {
  console.error('Seed refusé par PostgreSQL.');
  const connectionPattern = new RegExp('postgres' + '(?:ql)?' + '://\\S+', 'gi');
  console.error(result.stderr.replace(connectionPattern, '<connexion masquée>'));
  process.exit(1);
}

console.log('Réglages et feuille de route initiaux appliqués (sans écrasement).');
