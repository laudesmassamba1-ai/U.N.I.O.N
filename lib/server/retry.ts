const WAITS = [0, 700, 1500];
const TRANSIENT =
  /fetch failed|timeout|timed out|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|terminating connection|connection.*(closed|reset)|Control plane|57P03|NeonDbError.*(connect|network)/i;

export function isTransient(error: unknown): boolean {
  return TRANSIENT.test(String((error as Error)?.message ?? error));
}

/**
 * Trois essais au maximum. Une erreur de validation, de contrainte ou de quota
 * n’est jamais rejouée : elle ne guérira pas en 700 ms.
 */
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (const wait of WAITS) {
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    try {
      return await operation();
    } catch (error) {
      last = error;
      if (!isTransient(error)) throw error;
    }
  }
  throw last;
}
