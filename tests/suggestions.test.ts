import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  canSubmit,
  evaluateStatus,
  recordAttempt,
  statusTone,
  toggleVote,
  votePercent,
} from '../src/lib/suggestions';

const HOUR = 60 * 60 * 1000;

describe('limite de dépôt', () => {
  it('autorise deux suggestions sur une heure, pas trois', () => {
    const now = 1_000_000;
    expect(canSubmit([], now)).toBe(true);
    expect(canSubmit([now - 10_000], now)).toBe(true);
    expect(canSubmit([now - 10_000, now - 20_000], now)).toBe(false);
  });

  it('oublie les tentatives plus vieilles qu’une heure', () => {
    const now = 10 * HOUR;
    expect(canSubmit([now - HOUR - 1, now - HOUR - 2], now)).toBe(true);
    expect(recordAttempt([now - HOUR - 1], now)).toEqual([now]);
  });
});

describe('pourcentage de votes', () => {
  it('arrondit et gère l’absence de vote', () => {
    expect(votePercent(0, 0)).toBe(0);
    expect(votePercent(2, 1)).toBe(67);
    expect(votePercent(65, 35)).toBe(65);
  });
});

describe('statut des suggestions', () => {
  const base = {
    status: 'discussion',
    createdAt: new Date(0).toISOString(),
    votesUseful: 0,
    votesNotUseful: 0,
    archivedAt: null,
  };

  it('retient au seuil de 25 votes et 65 % utiles', () => {
    const result = evaluateStatus(
      { ...base, votesUseful: 17, votesNotUseful: 9 },
      DEFAULT_SETTINGS,
      1000,
    );
    expect(result.status).toBe('retained');
  });

  it('archive au seuil de 25 votes et 70 % inutiles', () => {
    const now = 1000;
    const result = evaluateStatus(
      { ...base, votesUseful: 6, votesNotUseful: 19 },
      DEFAULT_SETTINGS,
      now,
    );
    expect(result.status).toBe('archived');
    expect(result.archivedAt).toBe(new Date(now).toISOString());
  });

  it('fait expirer après 60 jours sans seuil atteint', () => {
    const result = evaluateStatus(
      { ...base, votesUseful: 2, votesNotUseful: 1 },
      DEFAULT_SETTINGS,
      61 * 24 * HOUR,
    );
    expect(result.status).toBe('expired');
  });

  it('ne rouvre jamais un statut verrouillé', () => {
    const result = evaluateStatus(
      {
        ...base,
        status: 'integrated',
        votesUseful: 999,
        votesNotUseful: 0,
      },
      DEFAULT_SETTINGS,
      1000,
    );
    expect(result.status).toBe('integrated');
  });
});

describe('vote', () => {
  const counts = { useful: 4, notUseful: 2 };

  it('ajoute un vote utile', () => {
    expect(toggleVote(null, 'useful', counts)).toEqual({
      vote: 'useful',
      useful: 5,
      notUseful: 2,
    });
  });

  it('retire un vote identique', () => {
    expect(toggleVote('useful', 'useful', counts)).toEqual({
      vote: null,
      useful: 3,
      notUseful: 2,
    });
  });

  it('déplace un vote sans dépasser zéro', () => {
    expect(toggleVote('useful', 'not_useful', { useful: 0, notUseful: 0 })).toEqual({
      vote: 'not_useful',
      useful: 0,
      notUseful: 1,
    });
  });
});

describe('tonalité des statuts', () => {
  it('associe chaque famille de statut à un ton', () => {
    expect(statusTone('retained')).toBe('validated');
    expect(statusTone('discussion')).toBe('attention');
    expect(statusTone('archived')).toBe('closed');
    expect(statusTone('pending')).toBe('attention');
    expect(statusTone('inconnu')).toBe('neutral');
  });
});
