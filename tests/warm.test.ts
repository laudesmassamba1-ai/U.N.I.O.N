import { beforeEach, describe, expect, it } from 'vitest';
import { WARM_COOLDOWN_MS, lastWarmTimestamp, requestWarm, resetWarmForTests } from '../server/warm';

describe('réveil à l’intention', () => {
  beforeEach(() => resetWarmForTests());

  it('autorise un réveil puis refuse pendant dix minutes', () => {
    const start = 1_000_000;
    expect(requestWarm(start).allowed).toBe(true);
    const second = requestWarm(start + 60_000);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBe(540);
    expect(lastWarmTimestamp()).toBe(start);
  });

  it('autorise de nouveau après le délai', () => {
    const start = 2_000_000;
    expect(requestWarm(start).allowed).toBe(true);
    expect(requestWarm(start + WARM_COOLDOWN_MS + 1).allowed).toBe(true);
  });
});
