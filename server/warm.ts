/**
 * Réveil à l’intention : une seule ouverture toutes les dix minutes pour tout
 * le site. Le compteur vit en mémoire de la fonction ; il ne garde jamais la
 * base éveillée et ne remplace pas l’instantané public.
 */

export const WARM_COOLDOWN_MS = 10 * 60 * 1000;
export const WARM_MIN_TEXT_LENGTH = 20;

let lastWarmAt: number | null = null;

export function requestWarm(now = Date.now()): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  if (lastWarmAt !== null) {
    const remaining = WARM_COOLDOWN_MS - (now - lastWarmAt);
    if (remaining > 0) {
      return { allowed: false, retryAfterSeconds: Math.ceil(remaining / 1000) };
    }
  }
  lastWarmAt = now;
  return { allowed: true };
}

export function lastWarmTimestamp(): number | null {
  return lastWarmAt;
}

export function resetWarmForTests(): void {
  lastWarmAt = null;
}
