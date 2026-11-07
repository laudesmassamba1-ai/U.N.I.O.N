import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { requireEnv } from './env';

/**
 * Deux clients seulement, chacun avec son rôle et sa chaîne « pooler » :
 * - app_public : API publique, aucune empreinte de vote lisible par le Studio ;
 * - app_studio : contenu, modération, réglages.
 * Le propriétaire (`DATABASE_URL`) n’est utilisé que par les migrations.
 *
 * Requêtes HTTP simples : `drizzle-orm/neon-http`. Les transactions interactives
 * du Studio passeront par `neon-serverless`, jamais importé ici.
 */
export function appDatabase() {
  const sql = neon(requireEnv('DATABASE_URL_APP'));
  return drizzle(sql, { schema });
}

export function studioDatabase() {
  const sql = neon(requireEnv('DATABASE_URL_STUDIO'));
  return drizzle(sql, { schema });
}

export type AppDatabase = ReturnType<typeof appDatabase>;
export type StudioDatabase = ReturnType<typeof studioDatabase>;
