import { describe, expect, it } from 'vitest';
import { formatWeekRange, weekBounds } from '../src/lib/dates';

describe('semaine de Brazzaville', () => {
  it('encadre une semaine du lundi au dimanche', () => {
    const bounds = weekBounds('2026-11-06T12:00:00Z');
    expect(bounds.weekStart).toBe('2026-11-02');
    expect(bounds.weekEnd).toBe('2026-11-08');
  });

  it('traite le dimanche comme la fin de la semaine', () => {
    const bounds = weekBounds('2026-11-08T12:00:00Z');
    expect(bounds.weekStart).toBe('2026-11-02');
    expect(bounds.weekEnd).toBe('2026-11-08');
  });

  it('produit un numéro de semaine stable', () => {
    expect(weekBounds('2026-01-01T12:00:00Z').weekNumber).toBe(1);
  });

  it('formate la plage avec la préposition « au »', () => {
    const range = formatWeekRange('2026-11-02', '2026-11-08');
    expect(range).toContain(' au ');
  });
});
