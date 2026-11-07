/**
 * Résilience de la base : réveil, quota, contraintes.
 *
 * Ces primitives ne dépendent d’aucun moteur. Le serveur utilise PostgreSQL sur
 * Neon en production et PGlite en développement/test ; les motifs couvrent les
 * erreurs des deux pilotes.
 */

export type DbFailureKind = 'validation' | 'constraint' | 'quota' | 'wake' | 'unknown';

const CONSTRAINT_PATTERNS = [
  /\b2350[235]\b/,
  /UNIQUE constraint failed/i,
  /FOREIGN KEY constraint failed/i,
  /NOT NULL constraint failed/i,
  /CHECK constraint failed/i,
  /SQLITE_CONSTRAINT/,
];

const QUOTA_PATTERNS = [
  /\b53100\b/,
  /quota/i,
  /compute time/i,
  /no space left/i,
  /disk.*full/i,
  /SQLITE_FULL/,
  /project.*(limit|exceeded)/i,
];

const WAKE_PATTERNS = [
  /\b57P03\b/,
  /ECONNREFUSED/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /EAI_AGAIN/,
  /connection terminated/i,
  /connection.*(closed|reset|refused)/i,
  /fetch failed/i,
  /timed? ?out/i,
  /SQLITE_BUSY/,
  /database is locked/i,
];

export function classifyDatabaseError(error: unknown): DbFailureKind {
  const record = error as { name?: unknown; code?: unknown; message?: unknown } | null;
  if (record?.name === 'ValidationException') return 'validation';
  const code = typeof record?.code === 'string' ? record.code : '';
  const message = typeof record?.message === 'string' ? record.message : '';
  const haystack = `${code} ${message}`;
  if (CONSTRAINT_PATTERNS.some((pattern) => pattern.test(haystack))) return 'constraint';
  if (QUOTA_PATTERNS.some((pattern) => pattern.test(haystack))) return 'quota';
  if (WAKE_PATTERNS.some((pattern) => pattern.test(haystack))) return 'wake';
  return 'unknown';
}

export class DatabaseUnavailableError extends Error {
  readonly kind: 'quota' | 'wake';

  constructor(kind: 'quota' | 'wake', readonly cause?: unknown) {
    super(kind === 'quota' ? 'Quota de base de données atteint.' : 'Base de données momentanément indisponible.');
    this.name = 'DatabaseUnavailableError';
    this.kind = kind;
  }
}

export const DEGRADED_WRITE_MESSAGE =
  'Le dépôt est momentanément indisponible. Votre texte est conservé sur cet appareil, réessayez dans quelques minutes.';

export const QUOTA_COOLDOWN_MS = 10 * 60 * 1000;
export const DB_STATEMENT_TIMEOUT_MS = 5_000;
export const DB_RETRY_DELAYS_MS = [0, 700, 1500] as const;
export const DB_RETRY_BUDGET_MS = 8_000;

let quotaReachedAt: number | null = null;

export function noteQuotaFailure(now = Date.now()): void {
  if (quotaReachedAt === null) quotaReachedAt = now;
}

export function quotaCooldown(now = Date.now()): { retryAfterSeconds: number } | null {
  if (quotaReachedAt === null) return null;
  const remaining = QUOTA_COOLDOWN_MS - (now - quotaReachedAt);
  if (remaining <= 0) {
    quotaReachedAt = null;
    return null;
  }
  return { retryAfterSeconds: Math.ceil(remaining / 1000) };
}

export function resetResilienceForTests(): void {
  quotaReachedAt = null;
}

export interface RetryOptions {
  delays?: readonly number[];
  budgetMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (attempt: number, error: unknown, waitMs: number) => void;
}

/**
 * Trois essais au maximum (0 ms, 700 ms, 1 500 ms) dans un budget de huit
 * secondes. Une erreur de validation ou de contrainte n’est jamais rejouée :
 * elle ne guérira pas. Un quota épuisé bascule en mode dégradé pour dix minutes.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const delays = options.delays ?? DB_RETRY_DELAYS_MS;
  const budgetMs = options.budgetMs ?? DB_RETRY_BUDGET_MS;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const startedAt = now();
  let lastError: unknown;

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    const waitMs = delays[attempt] ?? 0;
    if (waitMs > 0) {
      if (now() - startedAt + waitMs > budgetMs) break;
      await sleep(waitMs);
    }
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const kind = classifyDatabaseError(error);
      if (kind === 'validation' || kind === 'constraint' || kind === 'unknown') throw error;
      if (kind === 'quota') {
        noteQuotaFailure(now());
        throw new DatabaseUnavailableError('quota', error);
      }
      options.onRetry?.(attempt + 1, error, delays[attempt + 1] ?? 0);
    }
  }

  if (lastError instanceof DatabaseUnavailableError) throw lastError;
  throw new DatabaseUnavailableError('wake', lastError);
}

export function withTimeout<T>(operation: Promise<T>, timeoutMs = DB_STATEMENT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DatabaseUnavailableError('wake', new Error(`Délai dépassé après ${timeoutMs} ms.`)));
    }, timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function degradedResponse(
  error: unknown,
): { status: number; body: Record<string, unknown>; retryAfterSeconds: number } | null {
  const kind = classifyDatabaseError(error);
  if (kind === 'quota') noteQuotaFailure();
  const cooldown = quotaCooldown();
  if (
    cooldown === null &&
    !(error instanceof DatabaseUnavailableError) &&
    kind !== 'quota' &&
    kind !== 'wake'
  ) {
    return null;
  }
  const quota =
    cooldown !== null ||
    kind === 'quota' ||
    (error instanceof DatabaseUnavailableError && error.kind === 'quota');
  const retryAfterSeconds = cooldown?.retryAfterSeconds ?? 600;
  return {
    status: 503,
    retryAfterSeconds,
    body: {
      error: DEGRADED_WRITE_MESSAGE,
      code: quota ? 'db_quota' : 'db_unavailable',
      retryAfter: retryAfterSeconds,
    },
  };
}
