import { z } from 'zod';

/**
 * Variables strictement serveur. Aucune n’est préfixée par VITE_ : tout ce qui
 * porte ce préfixe finit dans le JavaScript public.
 *
 * Aucun message d’erreur ne contient de valeur, seulement des noms de variables.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_URL_POOLED: z.string().min(1).optional(),
  DATABASE_URL_APP: z.string().min(1).optional(),
  DATABASE_URL_STUDIO: z.string().min(1).optional(),
  DATABASE_URL_BACKUP_RO: z.string().min(1).optional(),
  DATABASE_URL_BACKUP_WRITER: z.string().min(1).optional(),
  VOTE_HMAC_SECRET: z.string().min(32).optional(),
  VOTE_SECRET: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  STUDIO_SECRET: z.string().min(16).optional(),
  HEALTH_SECRET: z.string().min(16).optional(),
  REVALIDATE_SECRET: z.string().min(16).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  OBJECT_STORE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORE_BUCKET: z.string().min(1).optional(),
  OBJECT_STORE_ACCESS_KEY_ID: z.string().min(1).optional(),
  OBJECT_STORE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  OBJECT_STORE_PUBLIC_URL: z.string().url().optional(),
  BACKUP_AGE_PUBLIC_KEY: z.string().min(1).optional(),
  PUBLIC_SITE_URL: z.string().url().optional(),
  SNAPSHOT_URL: z.string().url().optional(),
  SNAPSHOT_WRITE_URL: z.string().url().optional(),
  SNAPSHOT_KEY: z.string().min(1).optional(),
  SNAPSHOT_PATH: z.string().min(1).optional(),
  WRITE_MODE: z.enum(['direct', 'buffered']).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvironmentError extends Error {
  constructor(readonly missing: string[]) {
    super(`Variables d’environnement manquantes : ${missing.join(', ')}.`);
    this.name = 'EnvironmentError';
  }
}

/** Lit l’environnement à l’appel : chaque fonction Vercel repart d’un processus neuf. */
export function readServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join('.'));
    throw new EnvironmentError([...new Set(names)].sort());
  }
  return parsed.data;
}

/** Exige une variable précise, sans jamais afficher sa valeur. */
export function requireEnv(name: keyof ServerEnv, source: NodeJS.ProcessEnv = process.env): string {
  const value = source[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new EnvironmentError([name]);
  }
  return value;
}

/** Contrôle groupé, appelé au début d’un gestionnaire. */
export function requireEnvGroup(
  names: Array<keyof ServerEnv>,
  source: NodeJS.ProcessEnv = process.env,
): void {
  const missing = names.filter((name) => {
    const value = source[name];
    return typeof value !== 'string' || value.length === 0;
  });
  if (missing.length > 0) throw new EnvironmentError(missing);
}
