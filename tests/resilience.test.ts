import { beforeEach, describe, expect, it } from 'vitest';
import {
  DatabaseUnavailableError,
  classifyDatabaseError,
  degradedResponse,
  quotaCooldown,
  resetResilienceForTests,
  withDbRetry,
  withTimeout,
} from '../server/resilience';

describe('résilience de la base', () => {
  beforeEach(() => resetResilienceForTests());

  it('classe contraintes, réveil, quota et validation', () => {
    expect(classifyDatabaseError(new Error('UNIQUE constraint failed: suggestions.id'))).toBe(
      'constraint',
    );
    expect(
      classifyDatabaseError(Object.assign(new Error('duplicate key'), { code: '23505' })),
    ).toBe('constraint');
    expect(classifyDatabaseError(new Error('connection terminated unexpectedly'))).toBe('wake');
    expect(classifyDatabaseError(Object.assign(new Error('x'), { code: '57P03' }))).toBe('wake');
    expect(classifyDatabaseError(new Error('compute time quota exceeded'))).toBe('quota');
    expect(
      classifyDatabaseError(Object.assign(new Error('x'), { name: 'ValidationException' })),
    ).toBe('validation');
    expect(classifyDatabaseError(new Error('bug interne'))).toBe('unknown');
  });

  it('réussit après deux échecs de connexion, aux délais prévus', async () => {
    const delays: number[] = [];
    let calls = 0;
    const value = await withDbRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error('Connection terminated');
        return 'ok';
      },
      {
        sleep: async (ms) => {
          delays.push(ms);
        },
      },
    );
    expect(value).toBe('ok');
    expect(calls).toBe(3);
    expect(delays).toEqual([700, 1500]);
  });

  it('ne rejoue jamais une contrainte ni une validation', async () => {
    let calls = 0;
    await expect(
      withDbRetry(
        async () => {
          calls += 1;
          throw new Error('UNIQUE constraint failed: suggestion_votes.id');
        },
        { sleep: async () => undefined },
      ),
    ).rejects.toThrow('UNIQUE');
    expect(calls).toBe(1);
  });

  it('bascule en quota sans nouvelle tentative et ouvre dix minutes de répit', async () => {
    let calls = 0;
    await expect(
      withDbRetry(
        async () => {
          calls += 1;
          throw new Error('compute time quota exceeded');
        },
        { sleep: async () => undefined },
      ),
    ).rejects.toBeInstanceOf(DatabaseUnavailableError);
    expect(calls).toBe(1);

    const response = degradedResponse(new Error('compute time quota exceeded'));
    expect(response?.status).toBe(503);
    expect(response?.body.code).toBe('db_quota');
    expect(quotaCooldown()?.retryAfterSeconds).toBeGreaterThan(590);
  });

  it('s’arrête quand le budget de huit secondes serait dépassé', async () => {
    let clock = 0;
    let calls = 0;
    await expect(
      withDbRetry(
        async () => {
          calls += 1;
          clock += 5_000;
          throw new Error('ETIMEDOUT');
        },
        {
          now: () => clock,
          sleep: async (ms) => {
            clock += ms;
          },
        },
      ),
    ).rejects.toBeInstanceOf(DatabaseUnavailableError);
    expect(calls).toBe(2);
  });

  it('coupe une opération trop lente', async () => {
    await expect(withTimeout(new Promise<void>(() => undefined), 10)).rejects.toBeInstanceOf(
      DatabaseUnavailableError,
    );
  });
});
